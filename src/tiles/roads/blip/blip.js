import './blip.scss';
const prefix = "./blips"

function Blip(data) {
    const src = data.src || "default"
    const size = data.size || 1.5
    const angle = data.coords.a || 0

    return (
        <div className="Blip"
            style={{
                top: data.coords.y,
                left: data.coords.x
            }}
        >
            <img 
                style={{
                    transform: `translate(-50%, -50%) rotateZ(${-angle}deg)`,
                    height: size+'vw',
                    width: size+'vw'
                }}
                alt=""
                src={`${prefix}/${src}.png`}
            />
        </div>
    )
}

export default Blip