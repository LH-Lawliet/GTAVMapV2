import './mapTile.scss';

const prefix = "./tiles";
const baseWidth = 100/2;

function MapTile(data) {
    let url = `${prefix}/blank.png`;

    let className = "mapTile"

    let folder = "LQ/"
    

    if (data.visible && data.zoomLevel>1.5) {
        folder = "HQ/"
        className += " HQ"
    }

    if (data.x>=2 && data.x<=3 && data.y>=2 && data.y<=4) {
        url = `${prefix}/${folder}minimap_sea_${data.y}_${data.x}.png`;
    };

    return (
        <div className={className} style={{
            width: data.zoomLevel*baseWidth+"vw"
        }}>
            <img src={url} alt={url}/>
        </div>
    );
}

export default MapTile;