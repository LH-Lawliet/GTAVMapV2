let points = require("./mimNodes.json");
const fs = require('fs');

console.log("file loaded")
nodes = {}

function posToArea(position, id=null) {
	let str = JSON.stringify(position)
	for (let area of points) {
		let posMin = area.DimensionMin
		let posMax = area.DimensionMax
		if ((position.X<posMax.X && position.X>posMin.X) && (position.Y<posMax.Y && position.Y>posMin.Y) && (position.Y<posMax.Y && position.Y>posMin.Y)) {
			for (let node of area["Nodes"]) {
				//console.log(str, node["Position"])
				if ((!id || (node.Id === id)) && str===JSON.stringify(node["Position"])) {
					return area.AreaId
				}
			}
		}
	}
	console.log("Should find it old fashion way")
	return findAreaFromNode(str)
}

function findAreaFromNode(str) {
	for (let area of points) { 
		for (let node of area["Nodes"]) {
			if (str===JSON.stringify(node["Position"])) {
				return area.AreaId
			}
		}
	}
}

function findNodeFromPos(position, areaIn) {
	let str = JSON.stringify(position)
	for (let node_ of areaIn["Nodes"]) {
		//console.log(str, node["Position"])
		if (str===JSON.stringify(node["Position"])) {
			return area.AreaId+"_"+node.Id
		}
	}

	for (let area of points) { 
		for (let node of area["Nodes"]) {
			//console.log(str, node["Position"])
			if (str===JSON.stringify(node["Position"])) {
				return area.AreaId+"_"+node.Id
			}
		}
	}

	//console.log("relou")
}

function getDistance_2(pos1, pos2) {
	return Math.sqrt((pos1.X-pos2.X)*(pos1.X-pos2.X)+(pos1.Y-pos2.Y)*(pos1.Y-pos2.Y))
}

let i = 0
for (let area of points) { 
	for (let node of area["Nodes"]) {
		//console.log(node)
		connectedNodes = []

		let thisId = area.AreaId+"_"+node.Id
		//console.log("-----------"+thisId+"--------------")
		for (let connectedNode of node["ConnectedNodes"]) {
			//console.log(connectedNode["Node"]["Position"],node["Position"])
			//let nodeId = findNodeFromPos(connectedNode["Node"]["Position"], area)
			let newId = posToArea(connectedNode["Node"]["Position"], connectedNode["Node"].Id)+"_"+connectedNode["Node"]["Id"]

			//console.log(newId)
			if (newId !== thisId) {
				let distance = getDistance_2(node["Position"], connectedNode["Node"]["Position"])
				if (!distance) {
					console.log(node, connectedNode["Node"]["Position"])
					break
				}
				connectedNodes.push({id:newId, distance:distance, forward:connectedNode["LaneCountForward"], backward:connectedNode["LaneCountBackward"]})
			}
		}
		//console.log("------------------------------------")


		/*  "StreetName": "0",
        "IsValidForGps": false,
        "IsJunction": false,
        "IsFreeway": false,
        "IsGravelRoad": false,
        "IsBackroad": true,
        "IsOnWater": true,
        "IsPedCrossway": false,
        "TrafficlightExists": false,
        "LeftTurnNoReturn": false,
        "RightTurnNoReturn": false,
    */
    //console.log(thisId, connectedNodes)
		nodes[thisId] = {
			id:thisId,
			position:node.Position, 
			GPSValid:node.IsValidForGps, 
			isJunction:node.IsJunction, 
			isFreeway:node.IsFreeway,
			isGravelRoad:node.IsGravelRoad,
			isBackroad: node.IsBackroad,
			isOnWater: node.IsOnWater,
			isPedCrossway: node.IsPedCrossway,
			trafficlightExists: node.TrafficlightExists,
			connectedNodes:connectedNodes
		}
	}
	console.log(i/(Object.keys(points).length)*100+"%")
	++i
}

//console.table(nodes)
console.log(Object.keys(nodes))


nodes = JSON.stringify(nodes)
fs.writeFile('./parsedNodes.json', nodes, err => {
  if (err) {
    console.error(err);
  }
  // fichier écrit avec succès
});