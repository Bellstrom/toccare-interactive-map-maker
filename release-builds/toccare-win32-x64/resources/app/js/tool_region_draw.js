const s = require('./shared');
var activeRegion;

function addRegion() {
  var new_id;
  var max_id;

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(region_id) AS max FROM region", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the region_node table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }
    });
    mapdb.run("INSERT INTO region (region_id) VALUES (?)", [new_id], function(err) {
      if (err) {
        return console.log(err.message);
      } else {
        console.log("Region " + new_id + " added to map in region table.");
        activeRegion = new_id;
      }
    });
  });

  return activeRegion;
}

exports.placeRegionNode = function(e) {
  if (grid.getActiveObject()) {
    if (grid.getActiveObject().databaseTable == "region_node" && grid.getActiveObject().databaseID == activeRegion.first_node_id) {
      console.log("Hit first node.");
    }
    s.previousRegionNode = grid.getActiveObject();
    return;
  }

  var region = activeRegion;

  if (!region) {
    region = addRegion();
  }

  console.log("activeRegion is " + activeRegion);

  // Create new node
  var new_id;
  var max_id;

  mapdb.serialize(function() {
    mapdb.get("SELECT MAX(region_node_id) AS max FROM region_node", function(err, row) {
      max_id = row.max;
      console.log("max_id is " + max_id);

      if (!max_id) { // If there are no rows in the region_node table
        new_id = 1;
      } else {
        new_id = max_id + 1;
      }


    });
    mapdb.run("INSERT INTO region_node (region_node_id, region_node_pos_x, region_node_pos_y, region_id) VALUES (?, ?, ?, ?)", [new_id, s.getRelativeCursorX(e), s.getRelativeCursorY(e), region], function(err) {
      if (err) {
        return console.log(err.message);
      } else {
        displayRegionNodeInMap(new_id, activeRegion);
        console.log("Node " + new_id + " added to map in region_node table with activeRegion " + region + ".");
      }

      if (s.previousRegionNode) {
        placeRegionEdge(s.previousRegionNode.databaseID, new_id);
      }

    });
  });
}

function displayRegionNodeInMap(id, region) {
  var selectStatement = "SELECT region_node_pos_x AS pos_x, region_node_pos_y AS pos_y FROM region_node WHERE region_node_id = " + id;
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
          databaseTable: 'region_node',
          regionID: region,
          hasControls: false,
          edgeArray: [],
        });
        s.addToMap(node);
        grid.setActiveObject(node);
        s.previousRegionNode = node;
      }
    });
  });

  return grid.getActiveObject();
}

function placeRegionEdge(node_id_1, node_id_2) {
  mapdb.run("INSERT INTO region_edge (region_node_id_1, region_node_id_2) VALUES (?, ?)", [node_id_1, node_id_2], function(err) {
    if (err) {
      return console.log(err.message);
    } else {
      if (displayRegionEdgeInMap(node_id_1, node_id_2)) {
        console.log("Placed edge between " + node_id_1 + " and " + node_id_2);
      } else {
        console.log("Placement failed.");
      }
    }
  });
}

function displayRegionEdgeInMap(node_id_1, node_id_2) {
  var node_1;
  var node_2;
  grid.forEachObject(function(obj) {
    if (obj.databaseTable == 'region_node') {
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
    databaseTable: 'region_edge',
    region_node_id_1: node_id_1,
    region_node_id_2: node_id_2,
    hoverCursor: 'default',
  });

  s.addToMap(edge);
  node_1.edgeArray.push(edge);
  node_2.edgeArray.push(edge);
  return edge;
}

exports.updateRegionNode = function(opt) {
  for (let item of grid.getActiveObjects()) {
    if (!item.databaseTable) {
      console.log("Selected object is not in the database.");
      continue;
    }
    var data = [item.left, item.top, item.databaseID];

    var sql = 'UPDATE region_node SET region_node_pos_x = ?, region_node_pos_y = ? WHERE region_node_id = ?';
    var selectStatement = 'SELECT region_node_pos_x AS pos_x, region_node_pos_y AS pos_y, region_node_id FROM region_node WHERE region_node_id = ' + item.databaseID;

    mapdb.serialize(() => {
      mapdb.run(sql, data, function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log('Row ' + item.databaseID + ' updated in table region_node.');
        updateRegionEdges(item);
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

function updateRegionEdges(region_node) {
  region_node.edgeArray.forEach(function(obj) {
    if (obj.region_node_id_1 == region_node.databaseID) {
      obj.set({
        'x1': region_node.left,
        'y1': region_node.top
      })
    } else {
      obj.set({
        'x2': region_node.left,
        'y2': region_node.top
      })
    }
  });
  grid.renderAll();
}

exports.deleteRegionNode = function(node) {
  mapdb.serialize(function() {
    var deleteStatement = "DELETE FROM region_edge WHERE region_node_id_1 = ? OR region_node_id_2 = ?";

    mapdb.run(deleteStatement, [node.databaseID, node.databaseID], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log("Rows deleted from region_edge.");
    });

    s.removeElementFromDatabase(node);
  });
  var deletedEdgeArray = node.edgeArray;
  var deletedNodeID = node.databaseID;

  grid.remove(node);

  if (deletedEdgeArray.length == 2) {
    console.log("Fusing edges.");
    fuseRegionEdges(deletedEdgeArray[0], deletedEdgeArray[1], deletedNodeID);
  } else {
    var i;
    for (i = 0; i < deletedEdgeArray.length; i++) {
      console.log("Deleting an edge.");
      deleteRegionEdgeFromMap(deletedEdgeArray[i]);
    }
  }
}

function deleteRegionEdgeFromMap(edge) {
  if (!edge) {
    console.log("Edge not found.");
    return;
  }
  grid.forEachObject(function(obj) {
    if (obj.databaseTable == 'region_node') {
      if (obj.databaseID != obj.databaseID == edge.region_node_id_1 || obj.databaseID == edge.region_node_id_2) {
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

function fuseRegionEdges(edge1, edge2, deletedNodeID) {
  var node_id_1, node_id_2;

  if (edge1.region_node_id_1 != deletedNodeID) {
    node_id_1 = edge1.region_node_id_1;
  } else {
    node_id_1 = edge1.region_node_id_2;
  }

  if (edge2.region_node_id_1 != deletedNodeID) {
    node_id_2 = edge2.region_node_id_1;
  } else {
    node_id_2 = edge2.region_node_id_2;
  }

  placeRegionEdge(node_id_1, node_id_2);
  deleteRegionEdgeFromMap(edge1);
  deleteRegionEdgeFromMap(edge2);
}
