var remote = require('electron').remote;
var sqlite3 = require('sqlite3').verbose();
var fs = remote.require('fs');

var dialog = remote.dialog;
var exports = module.exports;
var mapgrid = document.getElementById("mapgrid");

var mapdb;

exports.dragMap = function(map) {
  var x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0;
  map.onmousedown = dragBegin;

  function dragBegin(e) {
    e = e || window.event;
    e.preventDefault();
    x2 = e.clientX;
    y2 = e.clientY;
    document.onmouseup = dragEnd;
    document.onmousemove = repositionMap;
  }

  function repositionMap(e) {
    e = e || window.event;
    e.preventDefault();
    x1 = x2 - e.clientX;
    y1 = y2 - e.clientY;
    x2 = e.clientX;
    y2 = e.clientY;
    map.style.top = (map.offsetTop - y1) + "px";
    map.style.left = (map.offsetLeft - x1) + "px";
  }

  function dragEnd() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

exports.loadDatabase = function() {
  mapdb = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Map database loaded.');
  });

  mapdb.run("CREATE TABLE image (image_id INTEGER PRIMARY KEY NOT NULL UNIQUE, image_description TEXT, filepath TEXT NOT NULL)");
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
  var data = e.dataTransfer.getData("text");
  console.log(data);
  var mapElement = document.getElementById("imagebank-" + data);
  var grid = document.getElementById('mapgrid');
  var ctx = grid.getContext("2d");
  ctx.drawImage(mapElement, e.clientX, e.clientY);
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
