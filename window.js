const {ipcRenderer} = require('electron');

function goToAddScreen(e) {
  ipcRenderer.send('screen:add');
}
