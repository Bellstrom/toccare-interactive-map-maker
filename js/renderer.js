var remote = require('electron').remote;
var sqlite3 = require('sqlite3').verbose();
var fs = remote.require('fs');
var fabric = require('fabric').fabric;

var dialog = remote.dialog;
var exports = module.exports;
var mapgrid = document.getElementById("mapgrid");
var draggablemap = document.getElementById("draggablemap");

var grid;

var objectSelected = null;
var distanceScrolled = 0;

var mapdb;

exports.initializeMap = function() {
  grid = new fabric.Canvas('mapgrid');

  for (i = 0; i <= 2000; i += 80) {
    var verticalLine = new fabric.Line([i, 0, i, 2000], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
    });
    var horizontalLine = new fabric.Line([0, i, 2000, i], {
      stroke: '#aaa',
      strokeWidth: 2,
      selectable: false,
    })
    grid.add(verticalLine);
    grid.add(horizontalLine);
  }

  grid.on('mouse:wheel', function(opt) {
    var scrollDistance = -1 * opt.e.deltaY;
    var mapZoom = grid.getZoom();
    mapZoom = mapZoom + scrollDistance/500;
    if (mapZoom > 5) {
      mapZoom = 5;
    }
    if (mapZoom < 0.3) {
      mapZoom = 0.3;
    }
    grid.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, mapZoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
}

exports.dragMap = function(e) {
  if(e.button != 2) {
    return;
  }

  var xInitial = event.clientX;
  var yInitial = event.clientY;

function repositionMap(event) {
  var xFinal = event.clientX;
  var yFinal = event.clientY;
  grid.relativePan({x: xFinal - xInitial, y: yFinal - yInitial});
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
  mapdb.run("CREATE TABLE background (background_id INTEGER PRIMARY KEY NOT NULL UNIQUE, background_pos_x INTEGER NOT NULL, background_pos_y INTEGER NOT NULL, background_rotation INTEGER NOT NULL, image_id TEXT REFERENCES image (image_id) NOT NULL);");
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
    var htmlToAdd = "<div class=\"imagebank-grid-item\" draggable=\"true\" ondragstart=\"renderer.dragFromBank(event, " + id + ")\"><img src=\"" + filepath + "\" width=\"150\" id=\"imagebank-" + id + "\" draggable=\"false\"></div>";
    var imagegrid = document.getElementById("imagebank-grid");
    imagegrid.innerHTML = imagegrid.innerHTML + htmlToAdd;
    console.log(htmlToAdd);
  });

}

exports.dragFromBank = function(e, id) {
  e.dataTransfer.setData("text", id);
}

exports.addImageToMap = function(e) {
  e.preventDefault();
  var new_id;
  var map = document.getElementById("draggablemap");
  var data = e.dataTransfer.getData("text");
  console.log("Image ID is " + data);

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(background_id) AS max FROM background", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the background table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }

      mapdb.run("INSERT INTO background (background_id, background_pos_x, background_pos_y, background_rotation, image_id) VALUES (?, ?, ?, ?, ?)", [new_id, e.clientX - map.offsetLeft, e.clientY - map.offsetTop, 0, data], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          displayImageInMap(e, new_id);
          console.log("Element " + new_id + " added to map as background.");
        }
      });
    });
  });
}

function displayImageInMap(e, id) {
  var map = document.getElementById("draggablemap");
  var selectStatement = "SELECT background_pos_x, background_pos_y, background_rotation, image_id FROM background WHERE background_id = " + id;

  mapdb.get(selectStatement, function(err, row) {
    console.log("image_id is " + row.image_id);
    var imageSelectStatement = "SELECT filepath FROM image WHERE image_id = " + row.image_id;
    mapdb.get(imageSelectStatement, function(err, imageRow) {
      /*
      var mapContent = document.getElementById("mapcontent");
      var mapElement = "<img src=\"" + imageRow.filepath + "\" class=\"map-object\" id=\"background-" + id + "\" onclick=\"renderer.selectMapElement(event)\">";
      mapContent.innerHTML = mapContent.innerHTML + mapElement;
      var imgObject = document.getElementById("background-" + id);
      imgObject.style.left = row.background_pos_x + "px";
      imgObject.style.top = row.background_pos_y + "px";
      imgObject.style.zindex = row.background_id + "";
      console.log(imageRow.filepath);
      */
      fabric.Image.fromURL(imageRow.filepath, function(img) {
        img.id = "background-" + id;
        img.left = row.background_pos_x;
        img.top = row.background_pos_y;
        grid.add(img);
      });
    });
  });
}

exports.selectMapElement = function(e) {
  objectSelected = e.target;
  console.log("Selected element " + e.target.id);
}

exports.deselectMapElement = function() {
  if (objectSelected) {
    console.log("Deselected element " + objectSelected.id);
    objectSelected = null;
  }
}

exports.pressKey = function(e) {
  console.log("Key pressed.");
  switch (e.keyCode) {
    case 27: // Esc
      exports.deselectMapElement();
      break;
    case 46: // Delete
      deleteMapElement();
      break;
  }
}

function deleteMapElement() {
  if (objectSelected) {
    console.log("Element " + objectSelected.id + " marked for deletion.");
    exports.deselectMapElement();
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

exports.zoomMap = function(e) {
  distanceScrolled = distanceScrolled + e.deltaY;
  console.log("Scroll wheel used, distanceScrolled = " + distanceScrolled);

  if (distanceScrolled >= 100) {
    console.log("Zooming out.")
    multiplyMapScale(1.1);

    distanceScrolled = 0;
  } else if (distanceScrolled <= -100) {
    console.log("Zooming in.");
    var map = document.getElementById("draggablemap");
    map.style.zoom = map.style.zoom / 1.1;
    distanceScrolled = 0;
  }
}

function multiplyMapScale(multiplier) {
  var map = document.getElementById("draggablemap");
  var scale = map.style.transform;
  var currentScale = scale.substring(6, scale.length - 1); // scale value is stored as "scale(x)".
  var newScale = parseInt(currentScale, 10) * multiplier;
  map.style.transform = "scale(" + newScale + ")";
}
