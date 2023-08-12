import {useEffect, useState} from "react"

import './tiles.scss';
import MapTile from "./mapTile/mapTile";
import Roads from "./roads/roads";

const seaColor = "#11AAD6EE";
const seaColorTransparent = "#11AAD699";
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
    let style2 = {}


    let height = 100;

    if (inMinimap) {
        height = 25
        style.bottom = `5vh`
        style.backgroundColor = seaColorTransparent
        style.left = `5vh`
        style.height = `${height}vh`
        style.width = `${height}vh`
        style.borderRadius = "100%"
        style.transform = `rotate(${usedCenter["a"]}deg)`;
        style.opacity = "80%";
        style.WebkitMaskImage = "-webkit-radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0.999) 40.5%, rgba(0,0,0,0.997) 41%, rgba(0,0,0,0.993) 41.5%, rgba(0,0,0,0.989) 42%, rgba(0,0,0,0.982) 42.5%, rgba(0,0,0,0.975) 43%, rgba(0,0,0,0.966) 43.5%, rgba(0,0,0,0.956) 44%, rgba(0,0,0,0.945) 44.5%, rgba(0,0,0,0.933) 45%, rgba(0,0,0,0.919) 45.5%, rgba(0,0,0,0.904) 46%, rgba(0,0,0,0.888) 46.5%, rgba(0,0,0,0.871) 47%, rgba(0,0,0,0.853) 47.5%, rgba(0,0,0,0.834) 48%, rgba(0,0,0,0.814) 48.5%, rgba(0,0,0,0.793) 49%, rgba(0,0,0,0.772) 49.5%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.727) 50.5%, rgba(0,0,0,0.703) 51%, rgba(0,0,0,0.679) 51.5%, rgba(0,0,0,0.654) 52%, rgba(0,0,0,0.629) 52.5%, rgba(0,0,0,0.603) 53%, rgba(0,0,0,0.578) 53.5%, rgba(0,0,0,0.552) 54%, rgba(0,0,0,0.526) 54.5%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.473) 55.5%, rgba(0,0,0,0.447) 56%, rgba(0,0,0,0.421) 56.5%, rgba(0,0,0,0.396) 57%, rgba(0,0,0,0.37) 57.5%, rgba(0,0,0,0.345) 58%, rgba(0,0,0,0.32) 58.5%, rgba(0,0,0,0.296) 59%, rgba(0,0,0,0.273) 59.5%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.227) 60.5%, rgba(0,0,0,0.206) 61%, rgba(0,0,0,0.185) 61.5%, rgba(0,0,0,0.165) 62%, rgba(0,0,0,0.146) 62.5%, rgba(0,0,0,0.128) 63%, rgba(0,0,0,0.111) 63.5%, rgba(0,0,0,0.095) 64%, rgba(0,0,0,0.08) 64.5%, rgba(0,0,0,0.067) 65%, rgba(0,0,0,0.054) 65.5%, rgba(0,0,0,0.043) 66%, rgba(0,0,0,0.033) 66.5%, rgba(0,0,0,0.024) 67%, rgba(0,0,0,0.017) 67.5%, rgba(0,0,0,0.01) 68%, rgba(0,0,0,0.006) 68.5%, rgba(0,0,0,0.002) 69%, rgba(0,0,0,0) 69.5%";

    }

    return (
        <div id="map"
             style={style}
        >
            <div id="TilesContainer"
                style={style2}
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
