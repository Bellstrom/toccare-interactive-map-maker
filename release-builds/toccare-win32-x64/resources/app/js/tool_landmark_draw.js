const s = require('./shared');

exports.addDrawnLandmark = function(opt) {
  var path = opt.path;

  path.set({
    'databaseTable': 'landmark_drawn',
  });

  addDrawnLandmarkToDatabase(path);
  s.moveToLayer(path);

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
