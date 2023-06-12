import './roadTrack.scss';

function RoadTrack(data) {
    const color = data.color || 'purple'
    const processedPos = [data.pos1, data.pos2]
    const angle = Math.atan( (processedPos[1].y-processedPos[0].y)/(processedPos[1].x-processedPos[0].x) )
    return (
        <div className="RoadTrack"
            style={{
                backgroundColor:color,
                borderColor:color,
                position:"absolute",
                width:Math.sqrt(Math.pow((processedPos[1].x-processedPos[0].x),2) + Math.pow((processedPos[1].y-processedPos[0].y),2)),
                transform:`translateY(-50%) rotate(${angle}rad)`,
                top: processedPos[0].y,
                left: processedPos[0].x
            }}
        >
        </div>
    )
}

export default RoadTrack