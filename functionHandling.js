const {ipcRenderer} = require('electron');

var functions = [];

ipcMain.on('function:add', function(e, functionName, func) {
  console.log("function added");
  functions.push([functionName, func]);
});
