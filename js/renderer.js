const remote = require('electron').remote;
const {
  Menu,
  MenuItem
} = remote;
var sqlite3 = require('sqlite3').verbose();
var fs = remote.require('fs');
var fabric = require('fabric').fabric;

var dialog = remote.dialog;
var exports = module.exports;
var mapgrid = document.getElementById("mapgrid");
var draggablemap = document.getElementById("draggablemap");

var grid;

var activeLayer = "background";
var activeTool = "select";

var mapWidth = 2000;
var mapHeight = 2000;

var mapdb;

exports.initializeMap = function() {
  grid = new fabric.Canvas('mapgrid', {
    width: mapWidth,
    height: mapHeight
  });

  // draw grid
  for (i = 0; i <= mapHeight; i += 80) {
    var verticalLine = new fabric.Line([i, 0, i, mapWidth], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
      hoverCursor: "default",
      class: "gridline"
    });
    grid.add(verticalLine);
  }

  for (i = 0; i <= mapWidth; i += 80) {
    var horizontalLine = new fabric.Line([0, i, mapHeight, i], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
      hoverCursor: "default",
      class: "gridline"
    })
    grid.add(horizontalLine);
  }

  zoomMap();
  updateSelection();
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

}

exports.addImageToBank = function(selectedFiles) {
  var max_id;
  var new_id;
  var description = "No description.";

  console.log(selectedFiles);

  if (!selectedFiles) {
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

  grid.forEachObject(function(obj) {
    if (obj.databaseTable == activeLayer) {
      obj.selectable = false;
      obj.hoverCursor = "default";
    }

    if (obj.databaseTable == layer) {
      obj.selectable = true;
      obj.hoverCursor = "move";
    }
  });

  document.getElementById("button_" + activeLayer + "_layer").disabled = false;
  document.getElementById("button_" + layer + "_layer").disabled = true;

  activeLayer = layer;
  grid.discardActiveObject();
  grid.renderAll();

  console.log("Set active layer to " + activeLayer);
}

exports.addImageToMap = function(e) {
  e.preventDefault();
  var new_id;
  var map = document.getElementById("draggablemap");
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

      mapdb.run("INSERT INTO " + activeLayer + " (" + activeLayer + "_id, " + activeLayer + "_pos_x, " + activeLayer + "_pos_y, " + activeLayer + "_rotation, image_id) VALUES (?, ?, ?, ?, ?)", [new_id, e.clientX - map.offsetLeft, e.clientY - map.offsetTop, 0, data], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          displayImageInMap(new_id);
          console.log("Element " + new_id + " added to map in " + activeLayer + " layer.");
        }
      });
    });
  });
}

function displayImageInMap(id) {
  var map = document.getElementById("draggablemap");
  var selectStatement = "SELECT " + activeLayer + "_pos_x AS pos_x, " + activeLayer + "_pos_y AS pos_y, " + activeLayer + "_rotation AS rotation, image_id, " + activeLayer + "_scale_x AS scale_x, " + activeLayer + "_scale_y AS scale_y FROM " + activeLayer + " WHERE " + activeLayer + "_id = " + id;

  mapdb.get(selectStatement, function(err, row) {
    console.log("image_id is " + row.image_id);
    var imageSelectStatement = "SELECT filepath FROM image WHERE image_id = " + row.image_id;
    mapdb.get(imageSelectStatement, function(err, imageRow) {
      fabric.Image.fromURL(imageRow.filepath, function(img) {
        img.id = "background-" + id;
        img.left = row.pos_x;
        img.top = row.pos_y;
        img.scaleX = row.scale_x;
        img.scaleY = row.scale_y;
        img.angle = row.rotation;
        img.databaseTable = activeLayer;
        img.databaseID = id;
        grid.add(img);
      });
    });
  });
}

exports.pressKey = function(e) {
  switch (e.keyCode) {
    case 27: // Esc
      grid.discardActiveObject();
      grid.renderAll();
      break;
    case 46: // Delete
      deleteSelectedElements();
      break;
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

function multiplyMapScale(multiplier) {
  var map = document.getElementById("draggablemap");
  var scale = map.style.transform;
  var currentScale = scale.substring(6, scale.length - 1); // canvas scale value is stored as "scale(x)".
  var newScale = parseInt(currentScale, 10) * multiplier;
  map.style.transform = "scale(" + newScale + ")";
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

function updateSelection() {
  grid.on('object:modified', function(opt) {
    for (let item of grid.getActiveObjects()) {
      if (!item.databaseTable) {
        console.log("Selected object is not in the database.");
        return;
      }
      var data = [item.left, item.top, item.angle, item.scaleX, item.scaleY, item.databaseID];

      var sql = 'UPDATE ' + item.databaseTable + ' SET ' + item.databaseTable + '_pos_x = ?, ' + item.databaseTable + '_pos_y = ?, ' + item.databaseTable + '_rotation = ?, ' + item.databaseTable + '_scale_x = ?, ' + item.databaseTable + '_scale_y = ? ' +
        'WHERE ' + item.databaseTable + '_id = ?';
      var selectStatement = 'SELECT ' + item.databaseTable + '_pos_x AS pos_x, ' + item.databaseTable + '_pos_y AS pos_y, ' + item.databaseTable + '_rotation AS rotation, image_id, ' + item.databaseTable + '_scale_x AS scale_x, ' + item.databaseTable + '_scale_y AS scale_y FROM ' + item.databaseTable + ' WHERE ' + item.databaseTable + '_id = ' + item.databaseID;

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
  });
}

function deleteSelectedElements() {
  if (!grid.getActiveObjects()) {
    return;
  }
  for (let item of grid.getActiveObjects()) {
    removeElementFromDatabase(item);
    grid.remove(item);
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

  document.getElementById("buttons_background_tiles").innerHTML = "<button onclick=\"renderer.setBackgroundImage(" + id + ")\">OK</button>"+"<button onclick=\"renderer.closeFormBackgroundImage()\">Cancel</button>";
}

exports.closeFormBackgroundImage = function() {
  document.getElementById("form_background_tile").style.display = "none";
  document.getElementById("buttons_background_tiles").innerHTML = "";

  document.getElementById("text_background_tiles_width").value = "";
  document.getElementById("text_background_tiles_height").value = "";
}

exports.setBackgroundImage = function(id) {
  var horizontalTiles = document.getElementById("text_background_tiles_width").value;
  var verticalTiles = document.getElementById("text_background_tiles_height").value;

  if(horizontalTiles == "" || verticalTiles == "") {
    return;
  }
  var tileX = mapWidth / parseInt(horizontalTiles);
  var tileY = mapHeight / parseInt(verticalTiles);
  var imageSelectStatement = "SELECT filepath FROM image WHERE image_id = " + id;

  removeBackgroundImage();

  mapdb.get(imageSelectStatement, function(err, row) {

    for (i = 0; i < mapWidth; i += tileX) {
      for (j = 0; j < mapHeight; j += tileY) {
        fabric.Image.fromURL(row.filepath, function(img) {
          img.scaleX = tileX / img.width;
          img.scaleY = tileY / img.height;
          grid.add(img);
          grid.sendToBack(img);
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

function removeBackgroundImage() {
  grid.forEachObject(function(obj) {
    if (obj.class == "backgroundTile") {
      grid.remove(obj);
    }
  });
}

function toggleHideGrid() {
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
     grid.forEachObject(function(obj) {
       if (obj.databaseTable == activeLayer) {
         obj.selectable = true;
         obj.hoverCursor = "move";
       }
     });
     break;
     case "landmark_draw":
     break;
     case "road_draw":
     break;
     case "smart_road_draw":
     break;
     case "region_draw":
     break;
     case "text":
     break;
  }
}

function deactivateActiveTool() {
  switch (activeTool) {
     case "select":
     grid.forEachObject(function(obj) {
       if (obj.databaseTable == activeLayer) {
         obj.selectable = false;
         obj.hoverCursor = "default";
       }
     });
     break;
     case "landmark_draw":
     break;
     case "road_draw":
     break;
     case "smart_road_draw":
     break;
     case "region_draw":
     break;
     case "text":
     break;
  }
}
