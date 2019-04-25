exports.remote = require('electron').remote;
exports.sqlite3 = require('sqlite3').verbose();
exports.fs = exports.remote.require('fs');
exports.fabric = require('fabric').fabric;
exports.path = require('path');

exports.numberOfMapLayers = 10;

exports.dialog = exports.remote.dialog;
exports = module.exports;
global.mapgrid = document.getElementById("mapgrid");

exports.projectDirectory;

global.grid = 0;

global.activeLayer = "background";
global.activeTool = "select";

exports.layerTemplateObjects = [];
exports.previousRoadNode = null;
exports.previousRegionNode = null;
exports.regionInProgress = null;

exports.mapWidth = 2000;
exports.mapHeight = 2000;

global.mapdb = null;
exports.optionsFile = null;

exports.getRelativeCursorX = function(e) {
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

exports.getRelativeCursorY = function(e) {
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

exports.getObjectLayer = function(obj) {
  var objType;
  if (obj.databaseTable) {
    objType = obj.databaseTable;
  } else {
    objType = obj.class;
  }
  return objType;
}

exports.moveToLayer = function(obj) {
  var layerToMoveTo;
  switch (exports.getObjectLayer(obj)) {
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

  var layerIndex = grid.getObjects().indexOf(exports.layerTemplateObjects[layerToMoveTo]);
  grid.moveTo(obj, layerIndex - 1);
}

exports.addToMap = function(obj) {
  grid.add(obj);
  exports.moveToLayer(obj);
}

exports.removeElementFromDatabase = function(element) {
  var deleteStatement = "DELETE FROM " + element.databaseTable + " WHERE " + element.databaseTable + "_id = ?";
  mapdb.run(deleteStatement, element.databaseID, function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log("Row " + element.databaseID + " deleted from " + element.databaseTable);
  });
}

exports.loadPathFromJSON = function(pathData) {
  var parsedPathArray = JSON.parse(pathData);
  return new fabric.Path(parsedPathArray);
}

exports.setOpacityByLayer = function(layer, opacity) {
  grid.forEachObject(function(obj) {
    if (obj.class == layer || obj.databaseTable == layer) {
      obj.opacity = opacity;
    }
  });
  grid.renderAll();
}

exports.getImagePath = function(filename) {
  var htmlFriendlyPath = exports.projectDirectory.replace(/\\/g, "/");
  return htmlFriendlyPath + '/images/' + filename;
}

exports.getConfigSetting = function(setting, callback) {
  var selectStatement = "SELECT value FROM configuration WHERE setting = ?";
  mapdb.get(selectStatement, setting, function(err, row) {
    if (err) {
      return console.log(err.message);
    }
    callback(row.value);
  });
}

exports.setConfigSetting = function(setting, value, callback) {
  var updateStatement = "UPDATE configuration SET value = ? WHERE setting = ?";
  mapdb.run(updateStatement, [value, setting], function(err, row) {
    if (err) {
      return console.log(err.message);
    }
    callback();
  });
}
