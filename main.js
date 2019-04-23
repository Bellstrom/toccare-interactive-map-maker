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

app.on('ready', createWindow)

app.on('window-all-closed', function() {
  app.quit();
  console.log("Exiting Toccare Interactive Map Maker.");
})
