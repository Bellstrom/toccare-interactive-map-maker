var grid;
var mapWidth = 2000;
var mapHeight = 2000;

function initializeMap() {
  grid = new fabric.Canvas('mapgrid', {
    top: 0,
    left: 0,
    width: mapWidth,
    height: mapHeight,
    preserveObjectStacking: true,
    selection: false
  });

  grid.loadFromJSON(mapData, grid.renderAll.bind(grid));
  grid.on('mouse:dblclick', openFormLandmarkInformation);

  zoomMap();
}

function dragMap(e) {
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

function getRelativeCursorX(e) {
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

function getRelativeCursorY(e) {
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

  for (var i = 0; i < landmark.imageArray.length; i++) {
    var htmlToAdd = "<img src=\"images/" + landmark.imageArray[i] + "\" class=\"form_landmark_images_item\">";
    var landmarkimagegrid = document.getElementById("form_landmark_images");
    landmarkimagegrid.innerHTML = landmarkimagegrid.innerHTML + htmlToAdd;
  }

  document.getElementById("form_landmark_name").innerHTML = landmark.landmark_name;
  document.getElementById("form_landmark_description").innerHTML = landmark.landmark_description;

  document.getElementById("form_landmark").style.display = "block";
}

function closeFormLandmarkInformation() {
  document.getElementById("form_landmark").style.display = "none";
  document.getElementById("form_landmark_images").innerHTML = "";

  document.getElementById("form_landmark_name").value = "";
  document.getElementById("form_landmark_description").value = "";
}
