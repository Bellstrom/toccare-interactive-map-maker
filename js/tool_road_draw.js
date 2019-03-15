const s = require('./shared');
exports.placeRoadNode = function(e) {
  if (grid.getActiveObject()) {
    s.previousRoadNode = grid.getActiveObject();
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
    mapdb.run("INSERT INTO road_node (road_node_id, road_node_pos_x, road_node_pos_y) VALUES (?, ?, ?)", [new_id, s.getRelativeCursorX(e), s.getRelativeCursorY(e)], function(err) {
      if (err) {
        return console.log(err.message);
      } else {
        displayRoadNodeInMap(new_id);
        console.log("Node " + new_id + " added to map in road_node table.");
      }

      if (s.previousRoadNode) {
        placeRoadEdge(s.previousRoadNode.databaseID, new_id);
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
        s.addToMap(node);
        grid.setActiveObject(node);
        s.previousRoadNode = node;
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

  s.addToMap(edge);
  node_1.edgeArray.push(edge);
  node_2.edgeArray.push(edge);
  return edge;
}

exports.updateRoadNode = function(opt) {
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

exports.deleteRoadNode = function(node) {
  mapdb.serialize(function() {
    var deleteStatement = "DELETE FROM road_edge WHERE road_node_id_1 = ? OR road_node_id_2 = ?";

    mapdb.run(deleteStatement, [node.databaseID, node.databaseID], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log("Rows deleted from road_edge.");
    });

    s.removeElementFromDatabase(node);
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
