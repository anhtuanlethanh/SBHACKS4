const {app, BrowserWindow, ipcMain} = require('electron'); // http://electron.atom.io/docs/api
const path = require('path');         // https://nodejs.org/api/path.html
const url = require('url');           // https://nodejs.org/api/url.html

let mainWindow = null;
let bgWindow = null;


ipcMain.on('screen:Add', function(e, eventName, year) {
  mainWindow.loadURL('file://' + __dirname + '/addScreen.html');
});
ipcMain.on('screen:View', function(e, eventName, year) {
  mainWindow.loadURL('file://' + __dirname + '/viewScreen.html');
});
ipcMain.on('screen:main', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/popup.html');
});

// Wait until the app is ready
app.once('ready', () => {
  // Create a new window
  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    // Don't show the window until it ready, this prevents any white flickering
    show: false,
    // Don't allow the window to be resized.
    resizable: false,
  });

  // Load a URL in the window to the local index.html path
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'popup.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Show window when page is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });

  bgWindow = new BrowserWindow({
    width: 200,
    height: 200,
    show: false
  });
  bgWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'bg.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function() {
    app.quit();
  });
});



//Functions handling
var formulas = [];
ipcMain.on('function:add', function(e, formulaName, func) {
  var duplicate = false;
  for (var i = 0; i < formulas.length; i++) {
    if (formulas[i][0] == formulaName) {
      duplicate = true;
    }
  }
  if (!duplicate) {
    formulas.push([formulaName, func]);
  } else {
    console.log("Duplicate formula name!");
  }
});

ipcMain.on('function:get', function(event, search) {
  for (var i = 0; i < formulas.length; i++) {
    if (formulas[i][0] == search) {
      event.returnValue = formulas[i];
    }
  }
  event.returnValue = null;
});
