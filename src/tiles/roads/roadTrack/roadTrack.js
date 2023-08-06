import './roadTrack.scss';

function RoadTrack(data) {
    const color = data.color || 'purple'
    const processedPos = [data.pos2, data.pos1]
    //const angle = Math.atan2((processedPos[0].x-processedPos[1].x),(processedPos[0].y-processedPos[1].y));
    const angle=Math.atan2( (processedPos[1].y-processedPos[0].y),(processedPos[1].x-processedPos[0].x))
    return (
        <div 
            className={"RoadTrack "+angle}
            style={{
                backgroundColor:color,
                borderColor:color,
                width:Math.sqrt(Math.pow((processedPos[1].x-processedPos[0].x),2) + Math.pow((processedPos[1].y-processedPos[0].y),2)),
                //transform: 'translateY(-50%) rotate(90deg)',
                transform:`translateY(-50%) rotate(${angle}rad)`,
                top: processedPos[0].y,
                left: processedPos[0].x
            }}
        >
        </div>
    )
}

export default RoadTrack
