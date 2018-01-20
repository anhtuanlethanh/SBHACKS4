const {ipcRenderer} = require('electron');

function goToAddScreen(e) {
  console.log("test");
  ipcRenderer.send('screen:add');
}
