const s = require('./shared');

exports.addTextToDatabase = function(item) {
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

exports.addTextToMap = function(e) {
  if (grid.getActiveObject()) {
    return;
  }

  var text = new fabric.IText('', {
    left: s.getRelativeCursorX(e),
    top: s.getRelativeCursorY(e),
    originX: 'center',
    originY: 'center',
    fontSize: 24,
    fontFamily: 'Arial',
    textAlign: 'center',
    databaseTable: 'text',
    databaseID: null
  });
  s.addToMap(text);
  grid.setActiveObject(text);
  text.enterEditing();
  text.hiddenTextarea.focus();
}

exports.addOrUpdateText = function(opt) {
  for (let item of grid.getActiveObjects()) {
    if (!item.databaseTable) {
      console.log("Selected object is not in the database.");
      continue;
    }

    if (!item.databaseID) {
      exports.addTextToDatabase(item);
      continue;
    }

    if (item.text === '') {
      s.removeElementFromDatabase(item);
      grid.remove(item);
      continue;
    }

    updateText(item);
  }
}

exports.cleanUpEmptyITexts = function(opt) {
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
