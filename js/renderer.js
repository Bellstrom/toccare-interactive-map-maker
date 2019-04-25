const s = require('./shared');

const {
  Menu,
  MenuItem
} = s.remote;

var tool_landmark_draw = require('./tool_landmark_draw');
var tool_road_draw = require('./tool_road_draw');
var tool_smart_road_draw = require('./tool_smart_road_draw');
var tool_region_draw = require('./tool_region_draw');
var tool_text = require('./tool_text');
var export_map = require('./export_map');

exports.initializeMap = function(callback) {
  if (grid) {
    grid.clear();
  } else {
    grid = new s.fabric.Canvas('mapgrid', {
      top: 0,
      left: 0,
      width: s.mapWidth,
      height: s.mapHeight,
      preserveObjectStacking: true
    });
  }


  // initialize layer objects
  var i;
  for (i = 0; i < s.numberOfMapLayers * 2; i++) {
    s.layerTemplateObjects[i] = new s.fabric.Line([0, 0, 1, 1], {
      opacity: 0,
      selectable: false,
      hoverCursor: 'default',
      class: 'layerTemplateObject'
    });
    grid.add(s.layerTemplateObjects[i]);
  }

  // draw grid
  var i;
  for (i = 0; i <= s.mapHeight; i += 80) {
    var verticalLine = new s.fabric.Line([i, 0, i, s.mapWidth], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
      hoverCursor: "default",
      class: "gridline"
    });
    addToMap(verticalLine);
  }

  var i;
  for (i = 0; i <= s.mapWidth; i += 80) {
    var horizontalLine = new fabric.Line([0, i, s.mapHeight, i], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
      hoverCursor: "default",
      class: "gridline"
    })
    addToMap(horizontalLine);
  }

  zoomMap();

  callback();
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
  exports.closeDatabase();

  mapdb = new s.sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Map database loaded.');
  });

  mapdb.run("CREATE TABLE image (image_id INTEGER PRIMARY KEY NOT NULL UNIQUE, image_description TEXT, filename TEXT NOT NULL)");
  mapdb.run("CREATE TABLE background (background_id INTEGER PRIMARY KEY NOT NULL UNIQUE, background_pos_x INTEGER NOT NULL, background_pos_y INTEGER NOT NULL, background_rotation INTEGER NOT NULL, image_id TEXT REFERENCES image (image_id) NOT NULL, background_scale_x DOUBLE NOT NULL DEFAULT (1), background_scale_y DOUBLE NOT NULL DEFAULT (1));");
  mapdb.run("CREATE TABLE landmark (landmark_id INTEGER PRIMARY KEY UNIQUE NOT NULL, landmark_name TEXT, landmark_description TEXT, landmark_pos_x INTEGER NOT NULL, landmark_pos_y INTEGER NOT NULL, image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_rotation DOUBLE NOT NULL DEFAULT (0), landmark_scale_x DOUBLE NOT NULL DEFAULT (1), landmark_scale_y DOUBLE NOT NULL DEFAULT (1));");
  mapdb.run("CREATE TABLE landmark_drawn (landmark_drawn_id INTEGER PRIMARY KEY UNIQUE NOT NULL, landmark_drawn_name TEXT, landmark_drawn_description TEXT, landmark_drawn_pos_x INTEGER NOT NULL, landmark_drawn_pos_y INTEGER NOT NULL, path_json TEXT NOT NULL, landmark_drawn_rotation DOUBLE NOT NULL DEFAULT (0), landmark_drawn_scale_x DOUBLE NOT NULL DEFAULT (1), landmark_drawn_scale_y DOUBLE NOT NULL DEFAULT (1));");
  mapdb.run("CREATE TABLE image_shows_landmark (image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_id INTEGER REFERENCES landmark (landmark_id) NOT NULL);");
  mapdb.run("CREATE TABLE image_shows_landmark_drawn (image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_drawn_id INTEGER REFERENCES landmark_drawn (landmark_drawn_id) NOT NULL);");
  mapdb.run("CREATE TABLE region (region_id INTEGER PRIMARY KEY NOT NULL UNIQUE, region_id_super INTEGER REFERENCES region (region_id), region_name TEXT, region_description TEXT, first_node_id INTEGER REFERENCES region_node (region_node_id));");
  mapdb.run("CREATE TABLE region_node (region_node_id INTEGER NOT NULL UNIQUE, region_node_pos_x INTEGER NOT NULL, region_node_pos_y INTEGER NOT NULL, region_id INTEGER REFERENCES region (region_id) NOT NULL, PRIMARY KEY (region_node_id));");
  mapdb.run("CREATE TABLE region_edge (region_node_id_1 INTEGER REFERENCES region_node (region_node_id) NOT NULL, region_node_id_2 INTEGER REFERENCES region_node (region_node_id) NOT NULL, region_id INTEGER REFERENCES region (region_id));");
  mapdb.run("CREATE TABLE road (road_id INTEGER NOT NULL UNIQUE, road_name TEXT, road_description TEXT);");
  mapdb.run("CREATE TABLE road_node (road_node_id INTEGER NOT NULL UNIQUE, road_node_pos_x INTEGER NOT NULL, road_node_pos_y INTEGER NOT NULL, PRIMARY KEY (road_node_id));");
  mapdb.run("CREATE TABLE road_edge (road_node_id_1 INTEGER REFERENCES road_node (road_node_id) NOT NULL, road_node_id_2 INTEGER REFERENCES road_node (road_node_id) NOT NULL, road_id INTEGER REFERENCES road (road_id));");
  mapdb.run("CREATE TABLE text (text_id INTEGER PRIMARY KEY NOT NULL UNIQUE, text_pos_x INTEGER NOT NULL, text_pos_y INTEGER NOT NULL, text_rotation DOUBLE NOT NULL DEFAULT (0), content TEXT REFERENCES image (image_id) NOT NULL, text_scale_x DOUBLE NOT NULL DEFAULT (1), text_scale_y DOUBLE NOT NULL DEFAULT (1));");

  console.log('Tables created.');
}

function loadDatabaseFromFile(filepath, callback) {
  if (mapdb) {
    exports.closeDatabase();
  }

  mapdb = new s.sqlite3.Database(filepath, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Map database loaded.');
    callback();
  });
}

exports.closeDatabase = function() {
  mapdb.close((err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log('Database closed.');
  })
}

exports.newProject = function() {
  s.dialog.showSaveDialog({
    filters: [{
      name: 'Toccare Interactive Map Project (*.tim)',
      extensions: ['tim']
    }]
  }, function(filename) {
    if (filename === undefined) {
      return;
    }
    console.log('Saved to ' + filename);
    createProject(filename, function() {
      resetInterface();
      displayInterface();
    });

  });
}

function createProject(filename, callback) {
  var folderPath = filename.substring(0, filename.length - 4);
  s.fs.writeFile(filename, 'Toccare Interactive Map Maker TIM File', function(err) {
    if (err) {
      return;
    }

    if (!s.fs.existsSync(folderPath)) {
      s.fs.mkdir(folderPath, function(err) {
        if (err) {
          console.log(err);
          return;
        }
        s.projectDirectory = folderPath;
        var imagesFolderPath = folderPath + '\\images';
        s.fs.mkdir(imagesFolderPath, function(err) {
          if (err) {
            console.log(err);
            return;
          }
          var copyPath = s.projectDirectory + '\\mapData.db';
          s.fs.copyFile(s.path.resolve(__dirname, 'map.db'), copyPath, function(err) {
            if (err) {
              console.log(err);
            }
            console.log('Database is copied to ' + copyPath);
            loadDatabaseFromFile(copyPath, callback);
          });
        });
      });
    } else {
      callback();
    }
  });
}

exports.openProject = function() {
  s.dialog.showOpenDialog({
    filters: [{
      name: 'Toccare Interactive Map Project (*.tim)',
      extensions: ['tim']
    }]
  }, function(filename) {
    if (filename === undefined) {
      return;
    }
    console.log('Loading project ' + filename);
    var folderPath = filename.toString().substring(0, filename.toString().length - 4);
    console.log(folderPath);
    if (!s.fs.existsSync(folderPath)) {
      console.log('Project folder not found!');
      s.dialog.showMessageBox(null, {
        type: 'warning',
        title: 'Toccare Interactive Map Maker',
        detail: 'Project folder not found!',
      });
      return;
    }
    s.projectDirectory = folderPath;

    loadDatabaseFromFile(s.projectDirectory + '\\mapData.db', function() {
      resetInterface();
      loadDataFromDatabase();
      displayInterface();
    });
  });
}

function loadDataFromDatabase() {
  var imageSelectStatement = "SELECT image_id FROM image ORDER BY image_id";
  var backgroundSelectStatement = "SELECT background_id FROM background ORDER BY background_id";
  var landmarkSelectStatement = "SELECT landmark_id FROM landmark ORDER BY landmark_id";
  var landmarkDrawnSelectStatement = "SELECT landmark_drawn_id, landmark_drawn_pos_x, landmark_drawn_pos_y, landmark_drawn_rotation, path_json, landmark_drawn_scale_x, landmark_drawn_scale_y FROM landmark_drawn ORDER BY landmark_drawn_id";
  var textSelectStatement = "SELECT text_id, text_pos_x, text_pos_y, text_rotation, content, text_scale_x, text_scale_y FROM text ORDER BY text_id";
  var roadNodeSelectStatement = "SELECT road_node_id, road_node_pos_x, road_node_pos_y FROM road_node ORDER BY road_node_id";
  var roadEdgeSelectStatement = "SELECT road_edge_id FROM road_edge ORDER BY road_edge_id";
  var roadConnectionSelectStatement = "SELECT road_node_id FROM road_edge_connects_road_node WHERE road_edge_id = ";

  mapdb.serialize(function() {

    document.getElementById("imagebank-text").innerHTML = "<p>No images to display.</p>";
    document.getElementById("imagebank-grid").innerHTML = "";

    mapdb.each(imageSelectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      document.getElementById("imagebank-text").innerHTML = "<br>"; // This will only be triggered if there are any rows in the image table.
      displayImageInBank(row.image_id);
    });

    s.getConfigSetting('background_tiles_image_id', function(id) {
      if (id) {
        s.getConfigSetting('background_tiles_horizontal', function(tileX) {
          s.getConfigSetting('background_tiles_vertical', function(tileY) {
            s.getConfigSetting('background_tiles_opacity', function(opacity) {
              addBackgroundTiles(id, tileX, tileY, opacity);
            });
          });
        });
      }
    });

    s.getConfigSetting('grid_opacity', function(opacity) {
      grid.forEachObject(function(obj) {
        if (obj.class == "gridline") {
          obj.opacity = opacity;
        }
      });
      grid.renderAll();
    });

    mapdb.each(backgroundSelectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      displayImageInMap(row.background_id, 'background');
    });

    mapdb.each(landmarkSelectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      displayImageInMap(row.landmark_id, 'landmark');
    });

    mapdb.each(landmarkDrawnSelectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      var pathData = JSON.parse(row.path_json);
      var path = new s.fabric.Path(pathData, {
        dirty: false,
        fill: null,
        stroke: "rgb(0, 0, 0)",
        strokeDashArray: null,
        strokeLineCap: "round",
        strokeLineJoin: "round",
        strokeMiterLimit: 10,
        strokeWidth: 1,
        left: row.landmark_drawn_pos_x,
        top: row.landmark_drawn_pos_y,
        angle: row.landmark_drawn_rotation,
        scaleX: row.landmark_drawn_scale_x,
        scaleY: row.landmark_drawn_scale_y,
        databaseID: row.landmark_drawn_id,
        databaseTable: 'landmark_drawn'
      });
      grid.add(path);
      s.moveToLayer(path);
    });

    mapdb.each(textSelectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      var text = new s.fabric.IText(row.content, {
        left: row.text_pos_x,
        top: row.text_pos_y,
        angle: row.text_rotation,
        scaleX: row.text_scale_x,
        scaleY: row.text_scale_y,
        databaseID: row.text_id,
        databaseTable: 'text',
        originX: 'center',
        originY: 'center',
        fontSize: 24,
        fontFamily: 'Arial',
        textAlign: 'center'
      });

      grid.add(text);
      s.moveToLayer(text);
    });

    mapdb.each(roadNodeSelectStatement, function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      var node = new fabric.Circle({
        left: row.road_node_pos_x,
        top: row.road_node_pos_y,
        originX: 'center',
        originY: 'center',
        strokeWidth: 2,
        radius: 8,
        fill: '#fff',
        stroke: '#777',
        databaseID: row.road_node_id,
        databaseTable: 'road_node',
        hasControls: false,
        edgeArray: [],
      });
      s.addToMap(node);
    }, function() {
      grid.renderAll();
      mapdb.each(roadEdgeSelectStatement, function(edgeErr, edgeRow) {
        if (edgeErr) {
          return console.log(edgeErr.message);
        }
        mapdb.all(roadConnectionSelectStatement + edgeRow.road_edge_id, function(error, rows) {
          if (error) {
            return console.log(error.message);
          }
          console.log('rows[0] is ' + rows[0].road_node_id);
          console.log('rows[1] is ' + rows[1].road_node_id);
          tool_road_draw.displayRoadEdgeInMap(rows[0].road_node_id, rows[1].road_node_id);
        });
      });
    });
  });
}

function resetInterface() {
  exports.initializeMap(function() {
    exports.setActiveTool('select');
    exports.setActiveLayer('landmark');
  });
}

function displayInterface() {
  document.getElementById('form_create_project').style.display = 'none';
  document.getElementById('toolbar').style.display = 'grid';
  document.getElementById('imagebank').style.display = 'block';
  document.getElementById('draggablemap').style.display = 'block';
}

function hideInterface() {
  document.getElementById('form_create_project').style.display = 'block';
  document.getElementById('toolbar').style.display = 'none';
  document.getElementById('imagebank').style.display = 'none';
  document.getElementById('draggablemap').style.display = 'none';
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
  console.log(selectedFiles[0]);

  var filename = selectedFiles[0].name;

  var copyPath = s.projectDirectory + '\\images\\' + selectedFiles[0].name;
  console.log(copyPath);

  s.fs.copyFile(selectedFiles[0].path, copyPath, function(err) {
    if (err) {
      console.log(err);
    }
    console.log('Image is copied to ' + copyPath);
  });

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

      mapdb.run("INSERT INTO image (filename, image_description, image_id) VALUES (?, ?, ?)", [filename, description, new_id], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          displayImageInBank(new_id);
          console.log("Image " + filename + " added to database.");
        }
      });
    });
  });
}

function displayImageInBank(id) {
  var filepath;
  var selectStatement = "SELECT filename FROM image WHERE image_id = " + id;
  mapdb.get(selectStatement, function(err, row) {
    filepath = s.getImagePath(row.filename);
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

  setSelectableByTable(layer);
  setUnselectableByTable(activeLayer);
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

  var layerIndex = grid.getObjects().indexOf(s.layerTemplateObjects[layerToMoveTo]);
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

      mapdb.run("INSERT INTO " + activeLayer + " (" + activeLayer + "_id, " + activeLayer + "_pos_x, " + activeLayer + "_pos_y, " + activeLayer + "_rotation, image_id) VALUES (?, ?, ?, ?, ?)", [new_id, s.getRelativeCursorX(e), s.getRelativeCursorY(e), 0, data], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          displayImageInMap(new_id, activeLayer);
          console.log("Element " + new_id + " added to map in " + activeLayer + " layer at position (" + s.getRelativeCursorX(e) + ", " + s.getRelativeCursorY(e) + ").");
        }
      });
    });
  });
}

function displayImageInMap(id, layer) {
  var selectStatement = "SELECT " + layer + "_pos_x AS pos_x, " + layer + "_pos_y AS pos_y, " + layer + "_rotation AS rotation, image_id, " + layer + "_scale_x AS scale_x, " + layer + "_scale_y AS scale_y FROM " + layer + " WHERE " + layer + "_id = " + id;

  mapdb.get(selectStatement, function(err, row) {
    console.log("image_id is " + row.image_id);
    var imageSelectStatement = "SELECT filename FROM image WHERE image_id = " + row.image_id;
    mapdb.get(imageSelectStatement, function(err, imageRow) {
      var filepath = s.getImagePath(imageRow.filename);
      fabric.Image.fromURL(filepath, function(img) {
        img.left = row.pos_x;
        img.top = row.pos_y;
        img.originX = 'center';
        img.originY = 'center';
        img.scaleX = row.scale_x;
        img.scaleY = row.scale_y;
        img.angle = row.rotation;
        img.databaseTable = layer;
        img.databaseID = id;
        img.filename = imageRow.filename;
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
      s.previousRoadNode = null;
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
      tool_road_draw.deleteRoadNode(item);
      s.previousRoadNode = null;
    }
  } else {
    for (let item of grid.getActiveObjects()) {
      s.removeElementFromDatabase(item);
      grid.remove(item);
    }
  }
  grid.discardActiveObject();
  grid.renderAll();
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
    window: s.remote.getCurrentWindow()
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
  var tileX = s.mapWidth / parseInt(horizontalTiles);
  var tileY = s.mapHeight / parseInt(verticalTiles);

  s.setConfigSetting('background_tiles_image_id', id, function() {
    s.setConfigSetting('background_tiles_horizontal', tileX, function() {
      s.setConfigSetting('background_tiles_vertical', tileY, function() {
        s.setConfigSetting('background_tiles_opacity', 1, function() {
          addBackgroundTiles(id, tileX, tileY);
        });
      });
    });
  });
  exports.closeFormBackgroundImage();
}

function addBackgroundTiles(id, tileX, tileY, opacity) {
  var imageSelectStatement = "SELECT filename FROM image WHERE image_id = " + id;

  grid.forEachObject(function(obj) {
    if (obj.class == "backgroundTile") {
      grid.remove(obj);
    }
  });

  mapdb.get(imageSelectStatement, function(err, row) {

    var i, j;
    for (i = 0; i < s.mapWidth; i += tileX) {
      for (j = 0; j < s.mapHeight; j += tileY) {
        fabric.Image.fromURL(s.getImagePath(row.filename), function(img) {
          img.scaleX = tileX / img.width;
          img.scaleY = tileY / img.height;
          addToMap(img);
        }, {
          left: i,
          top: j,
          selectable: false,
          hoverCursor: "default",
          class: "backgroundTile",
          filename: row.filename,
          image_id: id,
          opacity: opacity
        });

      }
    }
  });
}

exports.removeBackgroundImage = function() {
  s.setConfigSetting('background_tiles_image_id', null, function() {
    s.setConfigSetting('background_tiles_horizontal', null, function() {
      s.setConfigSetting('background_tiles_vertical', null, function() {
        s.setConfigSetting('background_tiles_opacity', 1, function() {
          grid.forEachObject(function(obj) {
            if (obj.class == "backgroundTile") {
              grid.remove(obj);
            }
          });
        });
      });
    });
  });

}

exports.toggleHideGrid = function() {
  s.getConfigSetting('grid_opacity', function(currentOpacity) {
    s.setConfigSetting('grid_opacity', !currentOpacity, function() {
      grid.forEachObject(function(obj) {
        if (obj.class == "gridline") {
          obj.opacity = !currentOpacity;
        }
      });
      grid.renderAll();
    });
  });
}

exports.toggleHideBackgroundImage = function() {
  s.getConfigSetting('background_tiles_opacity', function(currentOpacity) {
    s.setConfigSetting('background_tiles_opacity', !currentOpacity, function() {
      grid.forEachObject(function(obj) {
        if (obj.class == "backgroundTile") {
          obj.opacity = !currentOpacity;
        }
      });
      grid.renderAll();
    });
  });
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
      setSelectableByTable('text');
      if (activeLayer == 'landmark') {
        setSelectableByTable('landmark_drawn');
      } else {
        setUnselectableByTable('landmark_drawn');
      }
      grid.on('mouse:dblclick', openFormLandmarkInformation);
      break;
    case "landmark_draw":
      grid.isDrawingMode = true;
      grid.on('path:created', tool_landmark_draw.addDrawnLandmark);
      break;
    case "road_draw":
      grid.on('mouse:down', tool_road_draw.placeRoadNode);
      grid.on('object:modified', tool_road_draw.updateRoadNode);
      grid.selection = false;
      setSelectableByTable('road_node');
      s.setOpacityByLayer('road_node', 1);
      break;
    case "smart_road_draw":
      break;
    case "region_draw":
      grid.on('mouse:down', tool_region_draw.placeRegionNode);
      grid.on('object:modified', tool_region_draw.updateRegionNode);
      grid.selection = false;
      setSelectableByTable('region_node');
      break;
    case "text":
      setSelectableByTable('text');
      grid.off('text:editing:entered');
      grid.on('mouse:down', tool_text.addTextToMap);
      grid.on('object:modified', tool_text.addOrUpdateText);
      grid.on('text:editing:exited', tool_text.cleanUpEmptyITexts);
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
      setUnselectableByTable('text');
      setUnselectableByTable('landmark_drawn');
      grid.off('mouse:dblclick');
      break;
    case "landmark_draw":
      grid.off('path:created');
      grid.isDrawingMode = false;
      setUnselectableByTable('landmark_drawn');
      break;
    case "road_draw":
      s.previousRoadNode = null;
      setUnselectableByTable('road_node');
      s.setOpacityByLayer('road_node', 0);
      grid.selection = true;
      break;
    case "smart_road_draw":
      break;
    case "region_draw":
      s.previousRegionNode = null;
      setUnselectableByTable('region_node');
      grid.selection = true;
      break;
    case "text":
      setUnselectableByTable('text');
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
  var selectStatement = "SELECT filename FROM image WHERE image_id = " + id;
  mapdb.get(selectStatement, function(err, row) {
    filepath = s.getImagePath(row.filename);
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

// Exporting maps

exports.exportMapToFiles = function() {
  export_map.exportMap();
}
