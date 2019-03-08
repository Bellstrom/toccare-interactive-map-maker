const {
  app,
  BrowserWindow
} = require('electron')

function createWindow() {

  win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('index.html');

  win.on('closed', function() {
    win = null;
  });
  require('./js/menubar');
}

function loadDatabase() {
  var sqlite3 = require('sqlite3').verbose();
  console.log('Test.');
  let mapdb = new sqlite3.Database('./database/map.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Map database loaded.');
  });
}

function startup() {
//  loadDatabase();
  createWindow();
}

app.on('ready', createWindow)
