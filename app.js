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

ipcMain.on('function:calc', function(event, formula, vars) {
  var operations = ["+", "-", "/", "*", "^"];

  var innerOperations = [];
  var lastOperation = -1;
  var leftParen = -1;

  //Need to replace all variables with numbers
  //maybe the person can type like "x = blah" and it'll search for x, then replace

  formula = "(" + formula + ")";
  formula = formula.replace(/\s/g, '');

  var opCount = 0;
  opCount = getOpCount(operations, formula);

  while (opCount != 0) {

    console.log("formula is " + formula);

    for (var i = 0; i < formula.length; i++) {
      //Put operations into array of operations within most parenthesized section
      if (operations.indexOf(formula[i]) != -1) {
        //Check if it's a negative or a subtraction
        if (formula[i] == "-") {
          if (! (i-1 < 0 || operations.indexOf(formula[i-1]) != -1 || formula[i-1] == "(")) {
            innerOperations.push(i);
          }
        } else {
          innerOperations.push(i);
        }
      }
      if (formula[i] == "(") {
        innerOperations = [];
        leftParen = i;
      }
      if (formula[i] == ")") {
        //IF THERE ARE NO OPERATIONS WITHIN THE PARENS, JUST remove the parens
        if (innerOperations.length == 0) {
          formula = formula.substring(0, leftParen) + formula.substring(leftParen + 1, i) + formula.substring(i + 1);
          console.log("parens removed: " + formula);
          break;
        }

        //Find the highest priority operation
        var opIndex = innerOperations[0];
        for (var j = 1; j < innerOperations.length; j++) {
          if (operations.indexOf(formula[opIndex]) < operations.indexOf(formula[innerOperations[j]])) {
            opIndex = innerOperations[j];
          }
        }

        //We now have the index of the operation to be carried out
        //Scan backwards for first number, scan forwards for second number
        var closestLeftIndex = leftParen;
        for (var j = 0; j < innerOperations.length; j++) {
          if (innerOperations[j] > closestLeftIndex && innerOperations[j] < opIndex) {
            closestLeftIndex = innerOperations[j];
          }
        }
        var closestRightIndex = i;
        for (var j = 0; j < innerOperations.length; j++) {
          if (innerOperations[j] < closestRightIndex && innerOperations[j] > opIndex) {
            closestRightIndex = innerOperations[j];
          }
        }

        console.log("opindex: " + opIndex);
        var leftNum = formula.substring(closestLeftIndex + 1, opIndex);
        console.log("leftnum before parse: " + leftNum);
        var leftNum = parseFloat(leftNum);
        var rightNum = formula.substring(opIndex + 1, closestRightIndex);
        console.log("rightnum before parse: " + rightNum);
        var rightNum = parseFloat(rightNum);

        console.log("TEST: " + leftNum + " and " + rightNum);

        //Calculate result
        var result;
        if (formula[opIndex] == "+") {
          result = leftNum + rightNum;
        }
        if (formula[opIndex] == "-") {
          result = leftNum - rightNum;
        }
        if (formula[opIndex] == "*") {
          result = leftNum * rightNum;
        }
        if (formula[opIndex] == "/") {
          result = leftNum / rightNum;
        }
        if (formula[opIndex] == "^") {
          result = Math.pow(leftNum, rightNum);
        }

        //Insert into formula
        var tempForm = formula.substring(0, closestLeftIndex + 1) + result + formula.substring(closestRightIndex);
        console.log("temporary formula: " + tempForm);
        formula = tempForm;

        //Repeat
        break;
      }
    }

    opCount = getOpCount(operations, formula);
  }

  event.returnValue = formula.substring(1, formula.length-1);
});

function getOpCount(operations, formula) {
  var opCount = 0;
  
  for (var i = 0; i < formula.length; i++) {
    if (operations.indexOf(formula[i]) != -1) {
      //Check if it's a negative vs subtraction
      if (formula[i] == "-") {
        if (! (i-1 < 0 || operations.indexOf(formula[i-1]) != -1 || formula[i-1] == "(")) {
          opCount++;
          console.log("this - is a subtraction");
        }
      } else {
        opCount++;
      }
    }
  }
  return opCount;
}
