const {Menu} = require('electron')
const electron = require('electron')
const app = electron.app

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click () {
        }
      },
      {
        label: 'Save As',
        accelerator: 'CmdOrCtrl+Shift+S',
        click () {
        }
      },
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click (item, focusedWindow) {
          focusedWindow.webContents.executeJavaScript('renderer.openProject()');
        }
      },
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click (item, focusedWindow) {
          focusedWindow.webContents.executeJavaScript('renderer.newProject()');
        }
      },
      {
        label: 'Export Map',
        accelerator: 'CmdOrCtrl+E',
        click (item, focusedWindow) {
          focusedWindow.webContents.executeJavaScript('renderer.exportMapToFiles()');
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Remove Background Image',
        accelerator: 'CmdOrCtrl+Shift+B',
        click (item, focusedWindow) {
          focusedWindow.webContents.executeJavaScript('renderer.removeBackgroundImage()');
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload()
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools()
        }
      }
    ]
  },
  {
    label: 'Map',
    submenu: [
      {
        label: 'Show or Hide Grid',
        accelerator: 'CmdOrCtrl+G',
        click (item, focusedWindow) {
          focusedWindow.webContents.executeJavaScript('renderer.toggleHideGrid()');
        }
      },
      {
        label: 'Show or Hide Background Image',
        accelerator: 'CmdOrCtrl+B',
        click (item, focusedWindow) {
          focusedWindow.webContents.executeJavaScript('renderer.toggleHideBackgroundImage()');
        }
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('http://electron.atom.io') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
  // Edit menu.
  template[1].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Speech',
      submenu: [
        {
          role: 'startspeaking'
        },
        {
          role: 'stopspeaking'
        }
      ]
    }
  )
  // Window menu.
  template[3].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ]
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
