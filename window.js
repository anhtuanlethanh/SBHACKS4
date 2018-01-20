const {ipcRenderer} = require('electron');


function goToScreen(scr) {
  console.log("test "+scr);
  ipcRenderer.send('screen:'+scr);
}
