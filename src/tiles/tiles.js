import {useEffect, useState} from "react"

import './tiles.scss';
import MapTile from "./mapTile/mapTile";
import Roads from "./roads/roads";

const seaColor = "#11AAD6";
const minZoom = 0.5;
const maxZoom = 4;
const minimapZoomLevel = 3;

const mapSize = {
    x:4096*2,
    y:4096*3,
}

let mouseClicked = false
let lastMousePos = {x:null,y:null}
let oldZoomLevel = 1

const RESSOURCE_NAME = "map"


const worldSize = [4500*2, 4500*3]
const topLeft = [-13140 + 4500*2, 17400 - 4500*2]

function mapToScreen_X(x) {
    return (x - topLeft[0]) * (mapSize["x"]/worldSize[0])
}
function mapToScreen_Y(y) {
    return (topLeft[1]-y) * (mapSize["y"]/worldSize[1])
}



function Tiles() {
    const [zoomLevel, setZoomLevel] = useState(maxZoom);
    const [inMinimap, setMinimap] = useState(true);
    const [center, setCenter] = useState({x:mapSize["x"]/2, y:mapSize["y"]/2, z:0, a:0}); //a is the angle
    const [plyPos, setPlyPos] = useState({X:0, Y:0, Z:0, A:0}); //a is the angle
    

    let usedCenter = inMinimap?{x:mapToScreen_X(plyPos["X"]),y:mapToScreen_Y(plyPos["Y"]), z:plyPos["Z"],a:plyPos["A"]}:center
    //console.log(usedCenter)


    function onKeyDown(e) {
        if (e.key === "m") {
            if (!inMinimap) {
                fetch(`https://${RESSOURCE_NAME}/forceMinimap`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify({})
                }).then(resp => resp.json()).then(resp => console.log(resp));
            }

            switchMinimapState(!inMinimap)
        }
    }

    function handleMessage(e) {
        if (e.data.type === 'setPos' && inMinimap) {
            //console.log(e.data)
            setPlyPos({X:e.data.pos.x, Y:e.data.pos.y, A:e.data.angle})
        } else if (e.data.type === 'fullScreenMap') {
            switchMinimapState(!inMinimap)
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown)

        window.addEventListener("message", handleMessage)

        return ()=>{
            document.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("message", handleMessage)
        }
    });



    function switchMinimapState(inMinimap) {
        if (inMinimap) {
            oldZoomLevel = zoomLevel
        }
        setZoomLevel(inMinimap?minimapZoomLevel:oldZoomLevel)
        setMinimap(inMinimap)
    }


    function wheel(e) {
        if (e.deltaY>0 && zoomLevel>minZoom) {
            let nz = zoomLevel-zoomLevel/10
            setZoomLevel(nz<minZoom?minZoom:nz)
        } else if (e.deltaY<0 && zoomLevel<maxZoom) {
            let nz = zoomLevel+zoomLevel/10
            setZoomLevel(nz>maxZoom?maxZoom:nz)
        }
    }

    let selectedTile = []

    for (let y=2; y<5; y++) {
        let found = false
        for (let x=2; x<4; x++) {
            let tileCoordsX = [4096*(x-2), 4096*(x-2)+4096]
            let tileCoordsY = [4096*(y-2), 4096*(y-2)+4096]

            if (tileCoordsX[0]<usedCenter["x"] && usedCenter["x"]<tileCoordsX[1] && tileCoordsY[0]<usedCenter["y"] && usedCenter["y"]<tileCoordsY[1]) {
                selectedTile = [x,y]
                found = true
                break
            }
        }
        if (found) break
    }

    let tiles = []
    for (let y=2; y<5; y++) {
        let line = []
        for (let x=2; x<4; x++) {
            let visible = (selectedTile[0]-1)<=(x) && (x)<=(selectedTile[0]+1) && (selectedTile[1]-1)<=(y) && (y)<=(selectedTile[1]+1)
            line.push(<MapTile key={`tile_${x}_${y}`} x={x} y={y} zoomLevel={zoomLevel} visible={visible}/>)
        }
        tiles.push(<div key={`tileLine_${y}`} className="tileLine">{line}</div>)
    }

    let style = {
        backgroundColor: seaColor,
    }

    let height = 100;

    if (inMinimap) {
        height = 25
        style.bottom = `5vh`
        style.left = `5vh`
        style.height = `${height}vh`
        style.width = `${height}vh`
        style.borderRadius = "100%"
        style.transform = `rotate(${usedCenter["a"]}deg)`;
        style.webkitMaskImage = "-webkit-radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 70%)";
    }

    return (
        <div id="map"
             style={style}
        >
            <div id="TilesContainer"
                onWheelCapture={wheel}
                onMouseDown={(e)=>{
                    if (inMinimap) return;
                    mouseClicked=true
                    lastMousePos = {
                        x:e.clientX,
                        y:e.clientY
                    }
                }}
                onMouseUp={(e)=>{if (inMinimap) return; mouseClicked=false}}
                onMouseMove={(e)=>{
                        if (!mouseClicked) {return}
                        if (inMinimap) return;
                        let nx = e.clientX
                        let ny = e.clientY


                        let moveCoef = mapSize["x"]/window.screen.availWidth/zoomLevel
                        let dx = (nx-lastMousePos.x)*moveCoef
                        let dy = (ny-lastMousePos.y)*moveCoef
                        lastMousePos = {
                            x:nx,
                            y:ny
                        }

                        setCenter({x:usedCenter["x"]-dx, y:usedCenter["y"]-dy, a:usedCenter["a"]})
                    }
                }

            >
                <div id="Tiles" style={{
                    transform:`
                        translateX(calc(${-usedCenter["x"]/mapSize["x"]*zoomLevel} * 100vw + 50%))
                        translateY(calc(${-usedCenter["y"]/mapSize["y"]} * 100% + ${height/2}vh))
                    `
                }}>
                    {tiles}
                    <Roads inMinimap={inMinimap} mapSize={mapSize} zoomLevel={zoomLevel} center={center} plyPos={plyPos}/>
                </div>
            </div>
        </div>
    );
}

export default Tiles;
