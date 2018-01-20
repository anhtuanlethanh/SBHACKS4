const {app, BrowserWindow, ipcMain} = require('electron'); // http://electron.atom.io/docs/api
const path = require('path');         // https://nodejs.org/api/path.html
const url = require('url');           // https://nodejs.org/api/url.html

let window = null;

ipcMain.on('screen:add', function(e, eventName, year) {
  window.loadURL('file://' + __dirname + '/addScreen.html');
});

// Wait until the app is ready
app.once('ready', () => {
  // Create a new window
  window = new BrowserWindow({
    width: 700,
    height: 500,
    // Don't show the window until it ready, this prevents any white flickering
    show: false,
    // Don't allow the window to be resized.
    resizable: false,
  });

  // Load a URL in the window to the local index.html path
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'popup.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Show window when page is ready
  window.once('ready-to-show', () => {
    window.show()
  });
});
