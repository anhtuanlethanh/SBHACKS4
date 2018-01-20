/*const ipcMain = require('electron').ipcMain;
const ipc = require('electron').ipcRenderer;
ipc.on('load-page', (event, arg) => {
    mainWindow.loadURL(arg);
});

function goToAddScreen(e) {
  console.log("test");
  mainWindow.loadUrl('file://' + __dirname + '/addScreen.html');
  //ipc.send('load-page', 'file://' + __dirname + '/addScreen.html');
}*/

const {ipcRenderer} = require('electron');

function goToAddScreen(e) {
  console.log("test");
  ipcRenderer.send('screen:add');
}
