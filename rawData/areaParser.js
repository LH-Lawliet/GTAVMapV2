let points = require("./mimNodes.json");
let nodes = require("./parsedNodes.json")

const fs = require('fs');

console.log("file loaded")

let areas = []
for (let area of points) { 
    let areaData = {id:area.AreaId+"", posMin:area.DimensionMin, posMax:area.DimensionMax, nodes:[]}
	for (let node of area["Nodes"]) {
		areaData.nodes.push(node.Id+"")
	}
    areas.push(areaData)
}

console.table(areas)

areas = JSON.stringify(areas)
fs.writeFile('./parsedAreas.json', areas, err => {
  if (err) {
    console.error(err);
  }
  // fichier écrit avec succès
});