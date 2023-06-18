import './roadTrack.scss';

function RoadTrack(data) {
    const color = data.color || 'purple'
    const processedPos = [data.pos1, data.pos2]
    //const angle = Math.atan2((processedPos[0].x-processedPos[1].x),(processedPos[0].y-processedPos[1].y));
    const angle=Math.atan2( (processedPos[1].y-processedPos[0].y),(processedPos[1].x-processedPos[0].x))+3.1415926535898
    return (
        <div 
            className={"RoadTrack "+angle}
            style={{
                backgroundColor:color,
                borderColor:color,
                width:Math.sqrt(Math.pow((processedPos[1].x-processedPos[0].x),2) + Math.pow((processedPos[1].y-processedPos[0].y),2)),
                transform:`rotate(${angle}rad) translateY(-50%)`,
                top: processedPos[0].y,
                left: processedPos[0].x
            }}
        >
        </div>
    )
}

export default RoadTrack
