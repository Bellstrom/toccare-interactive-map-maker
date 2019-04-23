const s = require('./shared');



exports.exportMap = function() {
  s.dialog.showOpenDialog({
      properties: ["openDirectory"]
    },
    function(directory) {
      if (directory === undefined) {
        return;
      }
      s.fs.mkdir(directory + '\\js', function(err) {
        if (err) {
          console.log(err.message);
        }
        copyImagesFolder(directory);
        copyMapShell(directory);
        packageCanvas(directory);
        console.log('Exported to ' + directory);
      });
    });
}

function packageCanvas(newDirectory) {
  var canvas = new fabric.Canvas('c');
  var canvasJSON = mapToJSON(grid);
  var landmarkArray = [];
  var landmarkDrawnArray = [];
  canvas.loadFromJSON(canvasJSON, function() {
    canvas.renderAll();

    canvas.forEachObject(function(object) {
      object.selectable = false;
      object.hasControls = false;
      object.hasBorders = false;
      object.lockMovementX = true;
      object.lockMovementY = true;
      object.hoverCursor = 'default';
      if (object.type == 'image') {
        object.src = 'images/' + object.filename;
      }

      if (object.databaseTable == "road_node") {
        object.opacity = 0;
      }

      if (object.databaseTable == "landmark") {
        object.selectable = true;
        object.set('landmark_name', '');
        object.set('landmark_description', '');
        object.set('imageArray', []);
        landmarkArray[object.databaseID] = object;
      }

      if (object.databaseTable == "landmark_drawn") {
        object.selectable = true;
        object.set('landmark_name', '');
        object.set('landmark_description', '');
        object.set('imageArray', []);
        landmarkDrawnArray[object.databaseID] = object;
      }
    });
    console.log(landmarkArray);
    console.log(landmarkDrawnArray);
    bundleLandmarkInformation(landmarkArray, landmarkDrawnArray, function() {
      writeCanvasToJSON(canvas, newDirectory);
    });
  });
}

function mapToJSON(canvas) {
  var canvasJSON = canvas.toJSON(['class', 'databaseID', 'databaseTable', 'landmark_name', 'landmark_description', 'imageArray', 'filename', 'selectable', 'lockMovementX', 'lockMovementY', 'hasControls', 'hasBorders', 'hoverCursor']);
  return canvasJSON;
}

function bundleLandmarkInformation(landmarkArray, landmarkDrawnArray, callback) {
  var imageFilenamesArray = [];

  var imageSelectStatement = "SELECT image_id, filename FROM image";
  mapdb.each(imageSelectStatement, [], function(err, row) {
    if (err) {
      return console.log(err.message);
    }
    imageFilenamesArray[row.image_id] = row.filename;
  }, function() {
    console.log(imageFilenamesArray);
    var landmarkSelectStatement = "SELECT landmark_id, landmark_name, landmark_description FROM landmark";
    mapdb.each(landmarkSelectStatement, [], function(err, row) {
      if (err) {
        return console.log(err.message);
      }
      var object = landmarkArray[row.landmark_id];
      if (object === undefined) {
        return console.log("Object is undefined.");
      }
      object.landmark_name = row.landmark_name;
      object.landmark_description = row.landmark_description;
    }, function() {
      var landmarkDrawnSelectStatement = "SELECT landmark_drawn_id, landmark_drawn_name, landmark_drawn_description FROM landmark_drawn";
      mapdb.each(landmarkDrawnSelectStatement, [], function(err, row) {
        if (err) {
          return console.log(err.message);
        }
        var object = landmarkDrawnArray[row.landmark_drawn_id];
        if (object === undefined) {
          return console.log("Object is undefined.");
        }
        object.landmark_name = row.landmark_drawn_name;
        object.landmark_description = row.landmark_drawn_description;
      }, function() {
        var imageLandmarkSelectStatement = "SELECT image_id, landmark_id FROM image_shows_landmark";
        mapdb.each(imageLandmarkSelectStatement, function(err, row) {
          if (err) {
            return console.log(err.message);
          } else {
            var object = landmarkArray[row.landmark_id];
            if (object === undefined) {
              return console.log("Object is undefined.");
            }
            object.imageArray.push(imageFilenamesArray[row.image_id]);
          }
        }, function() {
          var imageLandmarkDrawnSelectStatement = "SELECT image_id, landmark_drawn_id FROM image_shows_landmark_drawn";
          mapdb.each(imageLandmarkDrawnSelectStatement, function(err, row) {
            if (err) {
              return console.log(err.message);
            }
            var object = landmarkDrawnArray[row.landmark_drawn_id];
            if (object === undefined) {
              return console.log("Object is undefined.");
            }
            object.imageArray.push(imageFilenamesArray[row.image_id]);
          }, function() {
            callback();
          });
        });
      });
    });
  });
}

function writeCanvasToJSON(canvas, newDirectory) {
  var canvasJSON = mapToJSON(canvas);
  console.log(canvasJSON);
  var jsonPath = newDirectory + '\\js\\map_json.js';
  s.fs.writeFile(jsonPath, 'var mapData = ' + JSON.stringify(canvasJSON), function(err) {
    if (err) {
      console.log(err.message);
      s.dialog.showMessageBox(null, {
        type: 'warning',
        title: 'Toccare Interactive Map Maker',
        detail: 'Error writing file.',
      });
      return;
    }

    s.dialog.showMessageBox(null, {
      type: 'info',
      title: 'Toccare Interactive Map Maker',
      detail: 'Map exported to ' + newDirectory,
    });

  });
}

function copyImagesFolder(newDirectory) {
  var exportImagesPath = newDirectory + '\\images\\';
  s.fs.mkdir(exportImagesPath, function(err) {
    if (err) {
      console.log(err.message);
      return;
    }

    var projectImagesPath = s.projectDirectory + '\\images\\';
    s.fs.readdir(projectImagesPath, function(err, dir) {
      if (err) {
        console.log(err.message);
        return;
      }

      for (var filename of dir) {
        s.fs.copyFile(projectImagesPath + filename, exportImagesPath + filename, function(err) {
          if (err) {
            console.log(err.message);
          }
        });
      }
    });
  });
}

function copyMapShell(newDirectory) {
  s.fs.copyFile(s.path.resolve(__dirname, '../map_shell/map.html'), newDirectory + '\\map.html', function(err) {
    if (err) {
      console.log(err.message);
    }
  });

  s.fs.copyFile(s.path.resolve(__dirname, '../map_shell/styles.css'), newDirectory + '\\styles.css', function(err) {
    if (err) {
      console.log(err.message);
    }
  });

  s.fs.copyFile(s.path.resolve(__dirname, '../map_shell/js/fabric.min.js'), newDirectory + '\\js\\fabric.min.js', function(err) {
    if (err) {
      console.log(err.message);
    }
  });

  s.fs.copyFile(s.path.resolve(__dirname, '../map_shell/js/map_control.js'), newDirectory + '\\js\\map_control.js', function(err) {
    if (err) {
      console.log(err.message);
    }
  });
}
