import {useMemo, useState, useEffect, useCallback} from "react";
import Blip from "./blip/blip"
import RoadTrack from "./roadTrack/roadTrack"
import nodes from "./parsedNodes.json";
import areas from "./parsedAreas.json";
import './roads.scss';

const worldSize = [4500*2, 4500*3]
const topLeft = [-13140 + 4500*2, 17400 - 4500*2]
const doubleClickTimeout = 250 //250ms
const redrawPathCooldown = 500

let lastClick = 0


function findAreaFromPos(pos) {
	let x = pos.X
	let y = pos.Y
	for (let area of areas) {
		if ((area.posMin["X"]<=x) && (x<=area.posMax["X"]) && (area.posMin["Y"]<=y) && (y<=area.posMax["Y"])) {
			return [area.id, area.nodes]
		}
	}
}


function squaredDistance_2D(pos1, pos2) {
	const dx = pos2.X - pos1.X;
	const dy = pos2.Y - pos1.Y;
	return dx*dx + dy*dy;
}

function squaredDistance_3D(pos1, pos2) {
	const dx = pos2.X - pos1.X;
	const dy = pos2.Y - pos1.Y;
	const dz = pos2.Z - pos1.Z;
	return dx*dx + dy*dy + dz*dz;
}

function findClosestNode(x,y) {
	let point = {X:x, Y:y}

	let [areaId, nodeIdInArea] = findAreaFromPos(point)
	let closest = {node:null, distance:Infinity}
	for (let id of nodeIdInArea) {
		let node = nodes[areaId+"_"+id]
		//console.log(point, node.position)
		let dist = squaredDistance_2D(point, node.position)
		if (dist<closest.distance) {
			closest = {node:node, distance:dist}
		}
	}

	return closest.node
}
function findClosestNode_3D(x,y,z) {
	let point = {X:x, Y:y, Z:z}

	let [areaId, nodeIdInArea] = findAreaFromPos(point)
	let closest = {node:null, distance:Infinity}
	for (let id of nodeIdInArea) {
		let node = nodes[areaId+"_"+id]
		//console.log(point, node.position)
		let dist = squaredDistance_3D(point, node.position)
		if (dist<closest.distance) {
			closest = {node:node, distance:dist}
		}
	}

	return closest.node
}



let lastPathfinding = 0
let arrival = null

function Roads(data) {
	const [blips, setBlips] = useState([]);
	const [windowInnerWidth, setWindowInnerWidth] = useState(window.innerWidth);
    const [roadTracks, setRoadTracks] = useState([]);

    const windowSize = useMemo(()=>{return [windowInnerWidth, windowInnerWidth*(worldSize[1]/worldSize[0])]}, [windowInnerWidth])

	const inMinimap = false //data.inMinimap

	
	const mapToScreen_X = useCallback((x) => {
		return (x-topLeft[0])*(windowSize[0]/worldSize[0])
	},[windowSize])
	
	const mapToScreen_Y = useCallback((y) => {
		return (topLeft[1]-y) * (windowSize[1]/worldSize[1])
	},[windowSize])

	function refreshWindowSize() {
		setWindowInnerWidth(window.innerWidth)
	}


	function screenToMap_X(x) {
		if (inMinimap) {
            return 0
        } else {
            return (x/data.zoomLevel)/windowSize[0]*worldSize[0]+topLeft[0]
	    }
    }
	
	function screenToMap_Y(y) {
		if (inMinimap) {
            return 0
        } else {
            return topLeft[1]-((y/data.zoomLevel)/windowSize[1]*worldSize[1])
	    }
    }

	function processCoords(coords) {
		return {
			x:mapToScreen_X(coords.X)*data.zoomLevel,
			y:mapToScreen_Y(coords.Y)*data.zoomLevel,
			a:coords.A || 0
		}
	}


	function A_star(start, end) {
		for (let nodeid in nodes) {
			let node = nodes[nodeid]
			node.before = null
			node.next = null
			node.d = Infinity
			node.marked = false
			node.distFromArrival = Infinity
		}
	
		start.d = 0;
		start.distFromArrival = Math.sqrt(squaredDistance_3D(start.position, end.position));
	
		const untreated = [start]; //work like a priority queue
	
		while (untreated.length > 0) {
			const s = untreated.shift();

			if (s.id === end.id) {
				break
			}
	
			for (const nodedata of s.connectedNodes) {
				const nodeid = nodedata.id;
				const node = nodes[nodeid];
	
				if (nodedata.forward !== 0 && node !== s) {
					if (!node) {
						continue;
					}
	
					let distanceCoef = 1;
					let { isFreeway, isGravelRoad, GPSValid } = node;

					if (isFreeway) {
						distanceCoef *= 0.6;
					}
					if (isGravelRoad) {
						distanceCoef *= 1.3;
					}
					if (!GPSValid) { //should avoid as much as possible those kind of road
						distanceCoef *= 10;
					}


					if (node.d > (s.d + nodedata.distance * distanceCoef)) {
						node.d = (s.d + nodedata.distance * distanceCoef);
						node.before = s.id;
					}
	
					if (!node.marked) {
						node.marked = 1; 
	
						node.distFromArrival = Math.sqrt(squaredDistance_3D(node.position, end.position));
						let i = 0;
						for (let n of untreated) {
							if ((n.d+n.distFromArrival)>(node.d+node.distFromArrival)) break;
							i++
						}
						untreated.splice(i,0,node);	
					}
				}
			}
		}
	}


	const drawPath = useCallback((node, stopNode) => {
		let currentNode = node

		let nRoadTracks = []
		while (1) {
			if (!currentNode) {
				console.log("error on node : ", currentNode)
				break;
			}
			let pos1 = currentNode.position
			let before = nodes[currentNode.before]
			before.next = currentNode
			let pos2 = before.position
			currentNode = before
			nRoadTracks.push({pos1:pos1, pos2:pos2})

			if (!currentNode.before || (stopNode && (currentNode.id === stopNode.id))) {
				break
			}
		}
		setRoadTracks(nRoadTracks)
		lastPathfinding = Date.now()
	}, [])

	const handleMessage = useCallback((e) => {
		if (e.data.type === 'setPos') {
			//console.log(lastPathfinding, redrawPathCooldown, Date.now()-(lastPathfinding+redrawPathCooldown))
			if (arrival && (lastPathfinding+redrawPathCooldown)<Date.now()) {
				let x = e.data.pos["x"]
				let y = e.data.pos["y"]
				let z = e.data.pos["z"]

				let node1 = findClosestNode_3D(x,y,z)
				let node2 = arrival

				//console.log(node1.id)

				if (node1.next) {
					drawPath(node2, node1)
				} else {
					A_star(node1, node2)
					drawPath(node2)
				}
			}
		}
	}, [drawPath])

	let blipsElem = []

	for (let blip of blips) {
		blipsElem.push(<Blip src={blip.src} coords={processCoords(blip.coords)} color={blip.color} size={blip.size}/>)
	}

	blipsElem.push(<Blip src="arrow" coords={processCoords(data.plyPos)} size={1}/>)


	let roadTracksElem = []

	for (let roadTrack of roadTracks) {
		roadTracksElem.push(<RoadTrack pos1={processCoords(roadTrack.pos1)} pos2={processCoords(roadTrack.pos2)}/>)
	}


	
	useEffect(() => {
		window.addEventListener("message", handleMessage)

		window.addEventListener("resize", refreshWindowSize)
		
		/*let i = 0
		let interval = setInterval(()=> {
			handleMessage({data:{type:'setPos',pos:{x:i,y:i, z:0}}})
			console.log("move")
			i++
		},50)*/


		return ()=>{
            window.removeEventListener("message", handleMessage)
			window.removeEventListener("resize", refreshWindowSize)
			//clearInterval(interval)
        }
	}, [handleMessage]);


	return (
		<div id="Roads">
			{blipsElem}
			{roadTracksElem}

            <div id="trace" 
                onClick={(e)=>{
					let now = Date.now()

					if ((now-lastClick)<doubleClickTimeout) {
                        let cx = e.nativeEvent.offsetX
						let cy = e.nativeEvent.offsetY
                        console.log("clicked at : ", cx, cy)


                        let x = screenToMap_X(cx)
                        let y = screenToMap_Y(cy)

                        console.log("rendering to : ", screenToMap_X(x), screenToMap_Y(y))
                        
                        let node1 = findClosestNode_3D(data.plyPos["X"], data.plyPos["Y"], data.plyPos["Z"])
						let node2 = findClosestNode(x,y)
						arrival = node2

						A_star(node1, node2)
						drawPath(node2)

						let nBlips = JSON.parse(JSON.stringify(blips))//deepcopy
						let found = false;
						for (let i in nBlips) {
							let blip = nBlips[i]
							if (blip.src === "marker") {
								nBlips[i].coords = {X:x, Y:y}
								found = true
								break
							}
						}
						if (!found) {
							nBlips.push({
								src:"marker",
								color:"purple",
								coords: {X:x, Y:y}
							})
						}

						setBlips(nBlips)

                    }
					lastClick = now
                }}
                style={{
                    width:`calc(100vw*${data.zoomLevel})`, 
                    height:`calc(100vw*${worldSize[1]/worldSize[0]}*${data.zoomLevel})`
                }}
            >

            </div>

		</div>
	);
}

export default Roads;


/*
            <canvas 
				ref={canvasRef}
				onClick={(e)=>{
					let now = Date.now()
					if ((now-las
                    console.log(e)
                }}
                style={{
                    width:`calc(100vw*${data.zoomLevel})`, 
                    height:`calc(100vw*${worldSize[1]/worldSize[0]}*${data.zoomLevel})`
                }}
            >

            </div>

		</div>
	);
}

export default Roads;


/*
            <canvas 
				ref={canvasRef}
				onClick={(e)=>{
					let now = Date.now()
					if ((now-lastClick)<doubleClickTimeout) {
						//console.log(e)

						let cx = e.nativeEvent.offsetX
						let cy = e.nativeEvent.offsetY
						let x = screenToMap_X(cx)
						let y = screenToMap_Y(cy)
						

						let node1 = findClosestNode_3D(data.plyPos["X"], data.plyPos["Y"], data.plyPos["Z"])
						let node2 = findClosestNode(x,y)
						arrival = node2

						A_star(node1, node2)
						drawPath(node2)

						let nBlips = JSON.parse(JSON.stringify(blips))//deepcopy
						let found = false;
						for (let i in nBlips) {
							let blip = nBlips[i]
							if (blip.src === "marker") {
								nBlips[i].coords = {X:x, Y:y}
								found = true
								break
							}
						}
						if (!found) {
							nBlips.push({
								src:"marker",
								color:"purple",
								coords: {X:x, Y:y}
							})
						}

						setBlips(nBlips)
 					} else {
						lastClick = now
					}
				}}
				style={{
					width: `calc(100vw * ${data.zoomLevel})`,
        			height: `calc(100vw * ${data.mapSize["y"]/data.mapSize["x"]*data.zoomLevel})`
				}}
			></canvas>
*/
