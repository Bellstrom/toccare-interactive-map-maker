const remote = require('electron').remote;
const {
  Menu,
  MenuItem
} = remote;
var sqlite3 = require('sqlite3').verbose();
var fs = remote.require('fs');
var fabric = require('fabric').fabric;

var region_draw = require('./tool_region_draw');

const numberOfMapLayers = 10;

var dialog = remote.dialog;
var exports = module.exports;
var mapgrid = document.getElementById("mapgrid");

var grid;

var activeLayer = "background";
var activeTool = "select";

var layerTemplateObjects = [];
var previousRoadNode = null;
var previousRegionNode = null;

var mapWidth = 2000;
var mapHeight = 2000;

var mapdb;

exports.initializeMap = function() {
  grid = new fabric.Canvas('mapgrid', {
    top: 0,
    left: 0,
    width: mapWidth,
    height: mapHeight,
    preserveObjectStacking: true
  });

  // initialize layer objects
  var i;
  for (i = 0; i < numberOfMapLayers * 2; i++) {
    layerTemplateObjects[i] = new fabric.Line([0, 0, 1, 1], {
      opacity: 0,
      selectable: false,
      hoverCursor: 'default'
    });
    grid.add(layerTemplateObjects[i]);
  }

  // draw grid
  var i;
  for (i = 0; i <= mapHeight; i += 80) {
    var verticalLine = new fabric.Line([i, 0, i, mapWidth], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
      hoverCursor: "default",
      class: "gridline"
    });
    addToMap(verticalLine);
  }

  var i;
  for (i = 0; i <= mapWidth; i += 80) {
    var horizontalLine = new fabric.Line([0, i, mapHeight, i], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
      hoverCursor: "default",
      class: "gridline"
    })
    addToMap(horizontalLine);
  }

  zoomMap();
}

function testOn() {
  console.log("szfsd.");
}

exports.dragMap = function(e) {
  if (e.button != 2) {
    return;
  }

  var xInitial = event.clientX;
  var yInitial = event.clientY;

  function repositionMap(event) {
    var xFinal = event.clientX;
    var yFinal = event.clientY;
    grid.relativePan({
      x: xFinal - xInitial,
      y: yFinal - yInitial
    });
    xInitial = xFinal;
    yInitial = yFinal;
  }

  function endDrag(event) {
    window.removeEventListener("mousemove", repositionMap);
    window.removeEventListener("mouseup", endDrag);
  }

  window.addEventListener("mousemove", repositionMap);
  window.addEventListener("mouseup", endDrag);
}

exports.loadDatabase = function() {
  mapdb = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Map database loaded.');
  });

  mapdb.run("CREATE TABLE image (image_id INTEGER PRIMARY KEY NOT NULL UNIQUE, image_description TEXT, filepath TEXT NOT NULL)");
  mapdb.run("CREATE TABLE background (background_id INTEGER PRIMARY KEY NOT NULL UNIQUE, background_pos_x INTEGER NOT NULL, background_pos_y INTEGER NOT NULL, background_rotation INTEGER NOT NULL, image_id TEXT REFERENCES image (image_id) NOT NULL, background_scale_x DOUBLE NOT NULL DEFAULT (1), background_scale_y DOUBLE NOT NULL DEFAULT (1));");
  mapdb.run("CREATE TABLE landmark (landmark_id INTEGER PRIMARY KEY UNIQUE NOT NULL, landmark_name TEXT, landmark_description TEXT, landmark_pos_x INTEGER NOT NULL, landmark_pos_y INTEGER NOT NULL, image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_rotation DOUBLE NOT NULL DEFAULT (0), landmark_scale_x DOUBLE NOT NULL DEFAULT (1), landmark_scale_y DOUBLE NOT NULL DEFAULT (1));");
  mapdb.run("CREATE TABLE landmark_drawn (landmark_drawn_id INTEGER PRIMARY KEY UNIQUE NOT NULL, landmark_drawn_name TEXT, landmark_drawn_description TEXT, landmark_drawn_pos_x INTEGER NOT NULL, landmark_drawn_pos_y INTEGER NOT NULL, path_json TEXT NOT NULL, landmark_drawn_rotation DOUBLE NOT NULL DEFAULT (0), landmark_drawn_scale_x DOUBLE NOT NULL DEFAULT (1), landmark_drawn_scale_y DOUBLE NOT NULL DEFAULT (1));");
  mapdb.run("CREATE TABLE image_shows_landmark (image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_id INTEGER REFERENCES landmark (landmark_id) NOT NULL);");
  mapdb.run("CREATE TABLE image_shows_landmark_drawn (image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_drawn_id INTEGER REFERENCES landmark_drawn (landmark_drawn_id) NOT NULL);");
  mapdb.run("CREATE TABLE region (region_id INTEGER PRIMARY KEY NOT NULL UNIQUE, region_id_super INTEGER REFERENCES region (region_id), region_name TEXT, region_description TEXT);");
  mapdb.run("CREATE TABLE region_node (region_node_id INTEGER NOT NULL UNIQUE, region_node_pos_x INTEGER NOT NULL, region_node_pos_y INTEGER NOT NULL, PRIMARY KEY (region_node_id));");
  mapdb.run("CREATE TABLE region_edge (region_node_id_1 INTEGER REFERENCES region_node (region_node_id) NOT NULL, region_node_id_2 INTEGER REFERENCES region_node (region_node_id) NOT NULL, region_id INTEGER REFERENCES region (region_id));");
  mapdb.run("CREATE TABLE road (road_id INTEGER NOT NULL UNIQUE, road_name TEXT, road_description TEXT);");
  mapdb.run("CREATE TABLE road_node (road_node_id INTEGER NOT NULL UNIQUE, road_node_pos_x INTEGER NOT NULL, road_node_pos_y INTEGER NOT NULL, PRIMARY KEY (road_node_id));");
  mapdb.run("CREATE TABLE road_edge (road_node_id_1 INTEGER REFERENCES road_node (road_node_id) NOT NULL, road_node_id_2 INTEGER REFERENCES road_node (road_node_id) NOT NULL, road_id INTEGER REFERENCES road (road_id));");
  mapdb.run("CREATE TABLE text (text_id INTEGER PRIMARY KEY NOT NULL UNIQUE, text_pos_x INTEGER NOT NULL, text_pos_y INTEGER NOT NULL, text_rotation DOUBLE NOT NULL DEFAULT (0), content TEXT REFERENCES image (image_id) NOT NULL, text_scale_x DOUBLE NOT NULL DEFAULT (1), text_scale_y DOUBLE NOT NULL DEFAULT (1));");

  console.log('Tables created.');
}

exports.addImageToBank = function(selectedFiles) {
  var max_id;
  var new_id;
  var description = "No description.";

  console.log(selectedFiles);

  if (!selectedFiles || !selectedFiles[0]) {
    console.log("File is null.");
    return;
  }
  var reader = new FileReader();
  //reader.readAsDataURL(selectedFiles[0]);
  //var filepath = reader.result;
  var filepath = selectedFiles[0].path;
  filepath = filepath.replace(/\\/g, "/");

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(image_id) AS max FROM image", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the image table
        new_id = 1;
        document.getElementById("imagebank-text").innerHTML = "<br>"; // Remove the "No images to display." text in the imagebank.
      } else {
        new_id = max_id + 1;
      }

      mapdb.run("INSERT INTO image (filepath, image_description, image_id) VALUES (?, ?, ?)", [filepath, description, new_id], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          displayImageInBank(new_id);
          console.log("Image " + filepath + " added to database.");
        }
      });
    });
  });
}

function displayImageInBank(id) {
  var filepath;
  var selectStatement = "SELECT filepath FROM image WHERE image_id = " + id;
  mapdb.get(selectStatement, function(err, row) {
    filepath = row.filepath;
    var htmlToAdd = "<div class=\"imagebank-grid-item\" draggable=\"true\" ondragstart=\"renderer.dragFromBank(event, " + id + ")\" oncontextmenu=\"renderer.imagebankContextMenu(event, " + id + ")\"><img src=\"" + filepath + "\" width=\"150\" id=\"imagebank-" + id + "\" draggable=\"false\"></div>";
    var imagegrid = document.getElementById("imagebank-grid");
    imagegrid.innerHTML = imagegrid.innerHTML + htmlToAdd;
    console.log(htmlToAdd);
  });

}

exports.dragFromBank = function(e, id) {
  e.dataTransfer.setData("text", id);
}

exports.setActiveLayer = function(layer) {
  if (activeTool != "select") {
    document.getElementById("button_" + activeLayer + "_layer").disabled = false;
    document.getElementById("button_" + layer + "_layer").disabled = true;

    activeLayer = layer;
    return;
  }

  if (layer == activeLayer) {
    return;
  }

  setSelectableByTable(activeLayer);
  setUnselectableByTable(layer);
  if (layer == 'landmark') {
    setSelectableByTable('landmark_drawn');
  } else {
    setUnselectableByTable('landmark_drawn');
  }

  document.getElementById("button_" + activeLayer + "_layer").disabled = false;
  document.getElementById("button_" + layer + "_layer").disabled = true;

  activeLayer = layer;
  grid.discardActiveObject();
  grid.renderAll();

  console.log("Set active layer to " + activeLayer);
}

function getObjectLayer(obj) {
  var objType;
  if (obj.databaseTable) {
    objType = obj.databaseTable;
  } else {
    objType = obj.class;
  }
  return objType;
}

function moveToLayer(obj) {
  var layerToMoveTo;
  switch (getObjectLayer(obj)) {
    case 'backgroundTile':
      layerToMoveTo = 1;
      break;
    case 'gridline':
      layerToMoveTo = 3;
      break;
    case 'background':
      layerToMoveTo = 5;
      break;
    case 'region_edge':
      layerToMoveTo = 7;
      break;
    case 'region_node':
      layerToMoveTo = 9;
      break;
    case 'road_edge':
      layerToMoveTo = 11;
      break;
    case 'road_node':
      layerToMoveTo = 13;
      break;
    case 'landmark':
      layerToMoveTo = 15;
      break;
    case 'landmark_drawn':
      layerToMoveTo = 17;
      break;
    case 'text':
      layerToMoveTo = 19;
      break;
    default:
      layerToMoveTo = 0;
  }

  if (layerToMoveTo === -1) {
    console.log("Could not find layer.");
    return;
  }

  // Even though the code should send the tiled background objects below the grid, they're placed above the grid lines. This sends them directly to the bottom of the canvas stack.
  if (layerToMoveTo === 0) {
    grid.sendToBack(obj);
    return;
  }

  var layerIndex = grid.getObjects().indexOf(layerTemplateObjects[layerToMoveTo]);
  grid.moveTo(obj, layerIndex - 1);
}

function addToMap(obj) {
  grid.add(obj);
  moveToLayer(obj);
}

exports.addImageToMap = function(e) {
  e.preventDefault();
  if (activeTool != 'select') {
    exports.setActiveTool('select');
  }

  var new_id;
  var max_id;

  var data = e.dataTransfer.getData("text");
  console.log("Image ID is " + data);

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(" + activeLayer + "_id) AS max FROM " + activeLayer, function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the background table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }

      mapdb.run("INSERT INTO " + activeLayer + " (" + activeLayer + "_id, " + activeLayer + "_pos_x, " + activeLayer + "_pos_y, " + activeLayer + "_rotation, image_id) VALUES (?, ?, ?, ?, ?)", [new_id, getRelativeCursorX(e), getRelativeCursorY(e), 0, data], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          displayImageInMap(new_id);
          console.log("Element " + new_id + " added to map in " + activeLayer + " layer at position (" + getRelativeCursorX(e) + ", " + getRelativeCursorY(e) + ").");
        }
      });
    });
  });
}

function getRelativeCursorX(e) {
  var clientX;
  if (e.clientX) {
    clientX = e.clientX;
  } else if (e.e.clientX) {
    clientX = e.e.clientX;
  } else {
    console.log("Error getting clientX.");
    return;
  }
  return (clientX - grid.viewportTransform[4]) / grid.getZoom();
}

function getRelativeCursorY(e) {
  var clientY;
  if (e.clientY) {
    clientY = e.clientY;
  } else if (e.e.clientY) {
    clientY = e.e.clientY;
  } else {
    console.log("Error getting clientX.");
    return;
  }
  return (clientY - grid.viewportTransform[5]) / grid.getZoom();
}

function displayImageInMap(id) {
  var selectStatement = "SELECT " + activeLayer + "_pos_x AS pos_x, " + activeLayer + "_pos_y AS pos_y, " + activeLayer + "_rotation AS rotation, image_id, " + activeLayer + "_scale_x AS scale_x, " + activeLayer + "_scale_y AS scale_y FROM " + activeLayer + " WHERE " + activeLayer + "_id = " + id;

  mapdb.get(selectStatement, function(err, row) {
    console.log("image_id is " + row.image_id);
    var imageSelectStatement = "SELECT filepath FROM image WHERE image_id = " + row.image_id;
    mapdb.get(imageSelectStatement, function(err, imageRow) {
      fabric.Image.fromURL(imageRow.filepath, function(img) {
        img.left = row.pos_x;
        img.top = row.pos_y;
        img.originX = 'center';
        img.originY = 'center';
        img.scaleX = row.scale_x;
        img.scaleY = row.scale_y;
        img.angle = row.rotation;
        img.databaseTable = activeLayer;
        img.databaseID = id;
        addToMap(img);
      });
    });
  });
}

exports.pressKey = function(e) {
  switch (e.keyCode) {
    case 27: // Esc
      grid.discardActiveObject();
      grid.renderAll();
      previousRoadNode = null;
      break;
    case 46: // Delete
      deleteSelectedElements();
      break;
    default:
  }
}

exports.allowDrop = function(e) {
  e.preventDefault();
}

exports.closeDatabase = function() {
  mapdb.close((err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log('Database closed.');
  })
}

function zoomMap() {
  grid.on('mouse:wheel', function(opt) {
    var scrollDistance = -1 * opt.e.deltaY;
    var mapZoom = grid.getZoom();
    mapZoom = mapZoom + scrollDistance / 500;
    if (mapZoom > 5) {
      mapZoom = 5;
    }
    if (mapZoom < 0.3) {
      mapZoom = 0.3;
    }
    grid.zoomToPoint({
      x: opt.e.offsetX,
      y: opt.e.offsetY
    }, mapZoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
}

function updateMapElement(opt) {
  for (let item of grid.getActiveObjects()) {
    if (!item.databaseTable) {
      console.log("Selected object is not in the database.");
      continue;
    }
    var data = [item.left, item.top, item.angle, item.scaleX, item.scaleY, item.databaseID];

    var sql = 'UPDATE ' + item.databaseTable + ' SET ' + item.databaseTable + '_pos_x = ?, ' + item.databaseTable + '_pos_y = ?, ' + item.databaseTable + '_rotation = ?, ' + item.databaseTable + '_scale_x = ?, ' + item.databaseTable + '_scale_y = ? ' +
      'WHERE ' + item.databaseTable + '_id = ?';
    var selectStatement = 'SELECT ' + item.databaseTable + '_pos_x AS pos_x, ' + item.databaseTable + '_pos_y AS pos_y, ' + item.databaseTable + '_rotation AS rotation, ' + item.databaseTable + '_scale_x AS scale_x, ' + item.databaseTable + '_scale_y AS scale_y FROM ' + item.databaseTable + ' WHERE ' + item.databaseTable + '_id = ' + item.databaseID;

    mapdb.serialize(() => {
      mapdb.run(sql, data, function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log('Row ' + item.databaseID + ' updated in table ' + item.databaseTable + '.');
      });

      mapdb.get(selectStatement, function(err, row) {
        if (err) {
          return console.log(err.message);
        }
        console.log('pos_x = ' + row.pos_x);
        console.log('pos_y = ' + row.pos_y);
        console.log('rotation = ' + row.rotation);
        console.log('scale_x = ' + row.scale_x);
        console.log('scale_y = ' + row.scale_y);
      });
    });
  }
}

function deleteSelectedElements() {
  if (!grid.getActiveObjects()) {
    return;
  }
  if (activeTool == 'road_draw') {
    for (let item of grid.getActiveObjects()) {
      deleteRoadNode(item);
      previousRoadNode = null;
    }
  } else {
    for (let item of grid.getActiveObjects()) {
      removeElementFromDatabase(item);
      grid.remove(item);
    }
  }
  grid.discardActiveObject();
  grid.renderAll();
}

function removeElementFromDatabase(element) {
  var deleteStatement = "DELETE FROM " + element.databaseTable + " WHERE " + element.databaseTable + "_id = ?";
  mapdb.run(deleteStatement, element.databaseID, function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log("Row " + element.databaseID + " deleted from " + element.databaseTable);
  });
}

exports.imagebankContextMenu = function(e, id) {
  e.preventDefault();
  var menu = new Menu();
  menu.append(new MenuItem({
    label: 'Set as background image',
    click() {
      console.log('Set background image with image ' + id + '.');
      openFormBackgroundImage(id);
    }
  }));
  menu.popup({
    window: remote.getCurrentWindow()
  });
}

function openFormBackgroundImage(id) {
  document.getElementById("form_background_tile").style.display = "block";

  document.getElementById("buttons_background_tiles").innerHTML = "<button onclick=\"renderer.setBackgroundImage(" + id + ")\">OK</button>" + "<button onclick=\"renderer.closeFormBackgroundImage()\">Cancel</button>";
}

exports.closeFormBackgroundImage = function() {
  document.getElementById("form_background_tile").style.display = "none";
  document.getElementById("buttons_background_tiles").innerHTML = "";

  document.getElementById("text_background_tiles_horizontal").value = "";
  document.getElementById("text_background_tiles_vertical").value = "";
}

exports.setBackgroundImage = function(id) {
  var horizontalTiles = document.getElementById("text_background_tiles_horizontal").value;
  var verticalTiles = document.getElementById("text_background_tiles_vertical").value;

  if (horizontalTiles == "" || verticalTiles == "") {
    return;
  }
  var tileX = mapWidth / parseInt(horizontalTiles);
  var tileY = mapHeight / parseInt(verticalTiles);
  var imageSelectStatement = "SELECT filepath FROM image WHERE image_id = " + id;

  exports.removeBackgroundImage();

  mapdb.get(imageSelectStatement, function(err, row) {

    var i, j;
    for (i = 0; i < mapWidth; i += tileX) {
      for (j = 0; j < mapHeight; j += tileY) {
        fabric.Image.fromURL(row.filepath, function(img) {
          img.scaleX = tileX / img.width;
          img.scaleY = tileY / img.height;
          console.log(img.class);
          addToMap(img);
        }, {
          left: i,
          top: j,
          selectable: false,
          hoverCursor: "default",
          class: "backgroundTile"
        });

      }
    }
  });

  exports.closeFormBackgroundImage();
}

exports.removeBackgroundImage = function() {
  grid.forEachObject(function(obj) {
    if (obj.class == "backgroundTile") {
      grid.remove(obj);
    }
  });
}

exports.toggleHideGrid = function() {
  grid.forEachObject(function(obj) {
    if (obj.class == "gridline") {
      obj.opacity = !obj.opacity;
    }
  });
  grid.renderAll();
}

exports.setActiveTool = function(tool) {
  grid.discardActiveObject();
  grid.renderAll();

  document.getElementById("button_" + activeTool).disabled = false;
  document.getElementById("button_" + tool).disabled = true;
  deactivateActiveTool();
  activeTool = tool;

  switch (tool) {
    case "select":
      grid.on('object:modified', updateMapElement);
      setSelectableByTable(activeLayer);
      if (activeLayer == 'landmark') {
        setSelectableByTable('landmark_drawn');
      } else {
        setUnselectableByTable('landmark_drawn');
      }
      grid.on('mouse:dblclick', openFormLandmarkInformation);
      break;
    case "landmark_draw":
      grid.isDrawingMode = true;
      grid.on('path:created', addDrawnLandmark);
      break;
    case "road_draw":
      grid.on('mouse:down', placeRoadNode);
      grid.on('object:modified', updateRoadNode);
      setSelectableByTable('road_node');
      break;
    case "smart_road_draw":
      break;
    case "region_draw":
      break;
    case "text":
      grid.off('text:editing:entered');
      grid.on('mouse:down', addTextToMap);
      grid.on('object:modified', addOrUpdateText);
      grid.on('text:editing:exited', cleanUpEmptyITexts);
      break;
    default:
  }
}

function deactivateActiveTool() {
  grid.off('mouse:down');
  grid.off('object:modified');
  switch (activeTool) {
    case "select":
      setUnselectableByTable(activeLayer);
      setUnselectableByTable('landmark_drawn');
      grid.off('mouse:dblclick');
      break;
    case "landmark_draw":
      grid.off('path:created');
      grid.isDrawingMode = false;
      break;
    case "road_draw":
      previousRoadNode = null;
      setUnselectableByTable('road_node');
      break;
    case "smart_road_draw":
      break;
    case "region_draw":
      break;
    case "text":
      grid.on('text:editing:entered', function(e) {
        exports.setActiveTool('text');
        grid.setActiveObject(e.target);
        e.target.enterEditing();
        e.target.hiddenTextarea.focus();
      });
      break;
    default:
  }
}

function setUnselectableByTable(table) {
  grid.forEachObject(function(obj) {
    if (obj.databaseTable == table) {
      obj.selectable = false;
      obj.hoverCursor = "default";
    }
  });
}

function setSelectableByTable(table) {
  grid.forEachObject(function(obj) {
    if (obj.databaseTable == table) {
      obj.selectable = true;
      obj.hoverCursor = "move";
    }
  });
}

function placeRoadNode(e) {
  if (grid.getActiveObject()) {
    previousRoadNode = grid.getActiveObject();
    return;
  }

  // Create new node
  var new_id;
  var max_id;

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(road_node_id) AS max FROM road_node", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the road_node table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }


    });
    mapdb.run("INSERT INTO road_node (road_node_id, road_node_pos_x, road_node_pos_y) VALUES (?, ?, ?)", [new_id, getRelativeCursorX(e), getRelativeCursorY(e)], function(err) {
      if (err) {
        return console.log(err.message);
      } else {
        displayRoadNodeInMap(new_id);
        console.log("Node " + new_id + " added to map in road_node table.");
      }

      if (previousRoadNode) {
        placeRoadEdge(previousRoadNode.databaseID, new_id);
      }

    });
  });
}

function displayRoadNodeInMap(id) {
  var selectStatement = "SELECT road_node_pos_x AS pos_x, road_node_pos_y AS pos_y FROM road_node WHERE road_node_id = " + id;
  var new_node;

  mapdb.serialize(function() {
    mapdb.get(selectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      } else {
        var node = new fabric.Circle({
          left: row.pos_x,
          top: row.pos_y,
          originX: 'center',
          originY: 'center',
          strokeWidth: 2,
          radius: 8,
          fill: '#fff',
          stroke: '#777',
          databaseID: id,
          databaseTable: 'road_node',
          hasControls: false,
          edgeArray: [],
        });
        addToMap(node);
        grid.setActiveObject(node);
        previousRoadNode = node;
      }
    });
  });

  return grid.getActiveObject();
}

function placeRoadEdge(node_id_1, node_id_2) {
  mapdb.run("INSERT INTO road_edge (road_node_id_1, road_node_id_2) VALUES (?, ?)", [node_id_1, node_id_2], function(err) {
    if (err) {
      return console.log(err.message);
    } else {
      if (displayRoadEdgeInMap(node_id_1, node_id_2)) {
        console.log("Placed edge between " + node_id_1 + " and " + node_id_2);
      } else {
        console.log("Placement failed.");
      }
    }
  });
}

function displayRoadEdgeInMap(node_id_1, node_id_2) {
  var node_1;
  var node_2;
  grid.forEachObject(function(obj) {
    if (obj.databaseTable == 'road_node') {
      if (obj.databaseID == node_id_1) {
        node_1 = obj;
      } else if (obj.databaseID == node_id_2) {
        node_2 = obj;
      }
    }
  });

  if (!node_1 || !node_2) {
    console.log("Could not find nodes.");
    return null;
  }

  var coords = [node_1.left, node_1.top, node_2.left, node_2.top];
  var edge = new fabric.Line(coords, {
    fill: '#ccc',
    stroke: '#ccc',
    strokeWidth: 8,
    originX: 'center',
    originY: 'center',
    selectable: false,
    databaseTable: 'road_edge',
    road_node_id_1: node_id_1,
    road_node_id_2: node_id_2,
    hoverCursor: 'default',
  });

  addToMap(edge);
  node_1.edgeArray.push(edge);
  node_2.edgeArray.push(edge);
  return edge;
}

function updateRoadNode(opt) {
  for (let item of grid.getActiveObjects()) {
    if (!item.databaseTable) {
      console.log("Selected object is not in the database.");
      continue;
    }
    var data = [item.left, item.top, item.databaseID];

    var sql = 'UPDATE road_node SET road_node_pos_x = ?, road_node_pos_y = ? WHERE road_node_id = ?';
    var selectStatement = 'SELECT road_node_pos_x AS pos_x, road_node_pos_y AS pos_y, road_node_id FROM road_node WHERE road_node_id = ' + item.databaseID;

    mapdb.serialize(() => {
      mapdb.run(sql, data, function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log('Row ' + item.databaseID + ' updated in table road_node.');
        updateRoadEdges(item);
      });

      mapdb.get(selectStatement, function(err, row) {
        if (err) {
          return console.log(err.message);
        }
        console.log('pos_x = ' + row.pos_x);
        console.log('pos_y = ' + row.pos_y);
      });
    });
  }
}

function updateRoadEdges(road_node) {
  road_node.edgeArray.forEach(function(obj) {
    if (obj.road_node_id_1 == road_node.databaseID) {
      obj.set({
        'x1': road_node.left,
        'y1': road_node.top
      })
    } else {
      obj.set({
        'x2': road_node.left,
        'y2': road_node.top
      })
    }
  });
  grid.renderAll();
}

function deleteRoadNode(node) {
  mapdb.serialize(function() {
    var deleteStatement = "DELETE FROM road_edge WHERE road_node_id_1 = ? OR road_node_id_2 = ?";

    mapdb.run(deleteStatement, [node.databaseID, node.databaseID], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log("Rows deleted from road_edge.");
    });

    removeElementFromDatabase(node);
  });
  var deletedEdgeArray = node.edgeArray;
  var deletedNodeID = node.databaseID;

  grid.remove(node);

  if (deletedEdgeArray.length == 2) {
    console.log("Fusing edges.");
    fuseRoadEdges(deletedEdgeArray[0], deletedEdgeArray[1], deletedNodeID);
  } else {
    var i;
    for (i = 0; i < deletedEdgeArray.length; i++) {
      console.log("Deleting an edge.");
      deleteRoadEdgeFromMap(deletedEdgeArray[i]);
    }
  }
}

function deleteRoadEdgeFromMap(edge) {
  if (!edge) {
    console.log("Edge not found.");
    return;
  }
  grid.forEachObject(function(obj) {
    if (obj.databaseTable == 'road_node') {
      if (obj.databaseID != obj.databaseID == edge.road_node_id_1 || obj.databaseID == edge.road_node_id_2) {
        var i;
        for (i = 0; i < obj.edgeArray.length + 1; i++) {
          if (obj.edgeArray[i] == edge) {
            obj.edgeArray.splice(i, 1);
            console.log("Removed edge.");
          }
        }
      }
    }
  });
  grid.remove(edge);
}

function fuseRoadEdges(edge1, edge2, deletedNodeID) {
  var node_id_1, node_id_2;

  if (edge1.road_node_id_1 != deletedNodeID) {
    node_id_1 = edge1.road_node_id_1;
  } else {
    node_id_1 = edge1.road_node_id_2;
  }

  if (edge2.road_node_id_1 != deletedNodeID) {
    node_id_2 = edge2.road_node_id_1;
  } else {
    node_id_2 = edge2.road_node_id_2;
  }

  placeRoadEdge(node_id_1, node_id_2);
  deleteRoadEdgeFromMap(edge1);
  deleteRoadEdgeFromMap(edge2);
}

function addTextToDatabase(item) {
  var new_id;
  var max_id;

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(text_id) AS max FROM text", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the background table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }

      mapdb.run("INSERT INTO text (text_id, text_pos_x, text_pos_y, text_rotation, content) VALUES (?, ?, ?, ?, ?)", [new_id, item.left, item.top, 0, item.text], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          item.databaseID = new_id;
          console.log("Element " + new_id + " added to map in text layer.");
        }
      });
    });
  });
}

function addTextToMap(e) {
  if (grid.getActiveObject()) {
    return;
  }

  var text = new fabric.IText('', {
    left: getRelativeCursorX(e),
    top: getRelativeCursorY(e),
    originX: 'center',
    originY: 'center',
    fontSize: 24,
    fontFamily: 'Arial',
    textAlign: 'center',
    databaseTable: 'text',
    databaseID: null
  });
  addToMap(text);
  grid.setActiveObject(text);
  text.enterEditing();
  text.hiddenTextarea.focus();
}

function addOrUpdateText(opt) {
  for (let item of grid.getActiveObjects()) {
    if (!item.databaseTable) {
      console.log("Selected object is not in the database.");
      continue;
    }

    if (!item.databaseID) {
      addTextToDatabase(item);
      continue;
    }

    if (item.text === '') {
      removeElementFromDatabase(item);
      grid.remove(item);
      continue;
    }

    updateText(item);
  }
}

function cleanUpEmptyITexts(opt) {
  if (!opt.target) {
    return;
  }
  if (opt.target.text == '' && !opt.target.databaseID) {
    grid.remove(opt.target);
  }
}

function updateText(item) {
  var data = [item.left, item.top, item.angle, item.scaleX, item.scaleY, item.databaseID, item.text];

  var sql = 'UPDATE text SET text_pos_x = ?, text_pos_y = ?, text_rotation = ?, text_scale_x = ?, text_scale_y = ?, content = ? WHERE text_id = ?';
  var selectStatement = 'SELECT text_pos_x AS pos_x, text_pos_y AS pos_y, text_rotation AS rotation, content, text_scale_x AS scale_x, text_scale_y AS scale_y FROM text WHERE text_id = ' + item.databaseID;

  mapdb.serialize(() => {
    mapdb.run(sql, data, function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log('Row ' + item.databaseID + ' updated in table text.');
    });

    mapdb.get(selectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      console.log('pos_x = ' + row.pos_x);
      console.log('pos_y = ' + row.pos_y);
      console.log('rotation = ' + row.rotation);
      console.log('scale_x = ' + row.scale_x);
      console.log('scale_y = ' + row.scale_y);
      console.log('content = ' + row.content);
    });
  });
}

// Landmark Draw Tool
function addDrawnLandmark(opt) {
  var path = opt.path;

  path.set({
    'databaseTable': 'landmark_drawn',
  });

  addDrawnLandmarkToDatabase(path);
  moveToLayer(path);

}

function addDrawnLandmarkToDatabase(item) {
  var new_id;
  var max_id;

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(landmark_drawn_id) AS max FROM landmark_drawn", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the background table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }

      var pathData = JSON.stringify(item.path);
      mapdb.run("INSERT INTO landmark_drawn (landmark_drawn_id, landmark_drawn_pos_x, landmark_drawn_pos_y, landmark_drawn_rotation, path_json) VALUES (?, ?, ?, ?, ?)", [new_id, item.left, item.top, 0, pathData], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          item.databaseID = new_id;
          console.log("Element " + new_id + " added to map in landmark_drawn layer.");
        }
      });
    });
  });
}

function loadPathFromJSON(pathData) {
  var parsedPathArray = JSON.parse(pathData);
  return new fabric.Path(parsedPathArray);
}

// Landmark Information Storage

function openFormLandmarkInformation(e) {
  var landmark = grid.getActiveObjects()[0];

  if (!landmark) {
    return;
  }

  if (landmark.databaseTable != 'landmark' && landmark.databaseTable != 'landmark_drawn') {
    return;
  }
  grid.setActiveObject(landmark);
  grid.renderAll();

  document.getElementById("form_landmark").style.display = "block";

  document.getElementById("buttons_landmark").innerHTML = "<button onclick=\"renderer.storeLandmarkInformation(\'" + landmark.databaseID + "\', \'" + landmark.databaseTable + "\')\">OK</button>" + "<button onclick=\"renderer.closeFormLandmarkInformation()\">Cancel</button>";
  document.getElementById("form_landmark_images").setAttribute("data-databaseID", landmark.databaseID);
  document.getElementById("form_landmark_images").setAttribute("data-databaseTable", landmark.databaseTable);

  loadLandmarkInformation(landmark.databaseID, landmark.databaseTable);
  loadLandmarkImages(landmark.databaseID, landmark.databaseTable);
}

exports.addImageToLandmark = function(e) {
  e.preventDefault();
  var new_id;
  var max_id;

  var landmarkimagegrid = document.getElementById("form_landmark_images");
  var landmarkID = landmarkimagegrid.getAttribute("data-databaseID");
  var landmarkTable = landmarkimagegrid.getAttribute("data-databaseTable");
  var data = e.dataTransfer.getData("text");

  console.log("Image ID is " + data);

  mapdb.serialize(function() {
    var insertStatement = "INSERT INTO image_shows_" + landmarkTable + " (image_id, " + landmarkTable + "_id) VALUES (?, ?)";
    mapdb.run(insertStatement, [data, landmarkID], function(err) {
      if (err) {
        return console.log(err.message);
      } else {
        displayImageInLandmarkImages(data);
        console.log("Image " + data + " added to landmark.");
      }
    });
  });
}

function displayImageInLandmarkImages(id) {
  var filepath;
  var selectStatement = "SELECT filepath FROM image WHERE image_id = " + id;
  mapdb.get(selectStatement, function(err, row) {
    filepath = row.filepath;
    var htmlToAdd = "<img src=\"" + filepath + "\" class=\"form_landmark_images_item\">";
    var landmarkimagegrid = document.getElementById("form_landmark_images");
    landmarkimagegrid.innerHTML = landmarkimagegrid.innerHTML + htmlToAdd;
    console.log(htmlToAdd);
  });
}

function loadLandmarkInformation(id, table) {
  var selectStatement = "SELECT " + table + "_name AS name, " + table + "_description AS description FROM " + table + " WHERE " + table + "_id = " + id;
  mapdb.get(selectStatement, function(err, row) {
    if (err) {
      return console.log(err.message);
    } else {
      document.getElementById("text_landmark_name").value = row.name;
      document.getElementById("text_area_landmark_description").value = row.description;
    }
  });
}

function loadLandmarkImages(id, table) {
  var selectStatement = "SELECT image_id FROM image_shows_" + table + " WHERE " + table + "_id = " + id;
  mapdb.each(selectStatement, function(err, row) {
    if (err) {
      return console.log(err.message);
    } else {
      displayImageInLandmarkImages(row.image_id);
    }
  });
}

exports.storeLandmarkInformation = function(id, table) {
  var sql = 'UPDATE ' + table + ' SET ' + table + '_name = ?, ' + table + '_description = ? WHERE ' + table + '_id = ?';
  var data = [document.getElementById("text_landmark_name").value, document.getElementById("text_area_landmark_description").value, id];
  var selectStatement = "SELECT " + table + "_name AS name, " + table + "_description AS description FROM " + table + " WHERE " + table + "_id = " + id;
  mapdb.serialize(function() {
    mapdb.run(sql, data, function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log('Row ' + id + ' updated in table ' + table + '.');
    });

    mapdb.get(selectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      } else {
        console.log(table + "_name = " + row.name);
        console.log(table + "_description = " + row.description);
      }
    });
  });

  exports.closeFormLandmarkInformation();
}

exports.closeFormLandmarkInformation = function() {
  document.getElementById("form_landmark").style.display = "none";
  document.getElementById("buttons_landmark").innerHTML = "";
  document.getElementById("form_landmark_images").innerHTML = "";
  document.getElementById("form_landmark_images").setAttribute("data-databaseID", "");
  document.getElementById("form_landmark_images").setAttribute("data-databaseTable", "");

  document.getElementById("text_landmark_name").value = "";
  document.getElementById("text_area_landmark_description").value = "";
}
