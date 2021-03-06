const {app, BrowserWindow, ipcMain} = require('electron'); // http://electron.atom.io/docs/api
const path = require('path');         // https://nodejs.org/api/path.html
const url = require('url');           // https://nodejs.org/api/url.html

ipcMain.on('screen:Add', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/addScreen.html');
});
ipcMain.on('screen:View', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/viewScreen.html');
});
ipcMain.on('screen:Save', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/saveScreen.html');
});
ipcMain.on('screen:Load', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/loadScreen.html');
});
ipcMain.on('screen:Clear', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/clearScreen.html');
});
ipcMain.on('screen:main', function(e) {
  mainWindow.loadURL('file://' + __dirname + '/popup.html');
});


let mainWindow = null;
let bgWindow = null;


// Wait until the app is ready
app.once('ready', () => {
  // Create a new window
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
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

//Formula handling
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

ipcMain.on('function:delete', function(e, search) {
  for (var i = 0; i < formulas.length; i++) {
    if (formulas[i][0] == search) {
      formulas.splice(i, 1);
      break;
    }
  }
});

ipcMain.on('function:calc', function(event, formula, vars) {
  //ACTUAL CALCULATION
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
          var within = formula.substring(leftParen + 1, i);

          //If there is a tan/sin/cos whatever
          var specialOperators = ["sin", "cos", "tan"];
          var specOp = formula.substring(leftParen - 3, leftParen);
          if (specialOperators.indexOf(specOp) != -1) {
            var result;
            var len = 3;

            if (formula[leftParen - 4] == "a") {
              specOp = "a" + specOp;
              len = 4;
            }
            if (specOp == "sin") {
              result = Math.sin(parseFloat(formula.substring(leftParen + 1, i)));
            }
            if (specOp == "cos") {
              result = Math.cos(parseFloat(formula.substring(leftParen + 1, i)));
            }
            if (specOp == "tan") {
              result = Math.tan(parseFloat(formula.substring(leftParen + 1, i)));
            }
            if (specOp == "asin") {
              result = Math.asin(parseFloat(formula.substring(leftParen + 1, i)));
            }
            if (specOp == "acos") {
              result = Math.acos(parseFloat(formula.substring(leftParen + 1, i)));
            }
            if (specOp == "atan") {
              result = Math.atan(parseFloat(formula.substring(leftParen + 1, i)));
            }

            formula = formula.substring(0, leftParen - len) + result + formula.substring(i + 1);

            break;
          } else {
            //If there is no function
            formula = formula.substring(0, leftParen) + formula.substring(leftParen + 1, i) + formula.substring(i + 1);
            console.log("parens removed: " + formula);
            break;
          }
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
        for (var j = 0; j < vars.length; j++) {
          if (vars[j][0] == leftNum) {
            leftNum = vars[j][1];
            break;
          }
        }
        var leftNum = parseFloat(leftNum);

        var rightNum = formula.substring(opIndex + 1, closestRightIndex);
        console.log("rightnum before parse: " + rightNum);
        for (var j = 0; j < vars.length; j++) {
          if (vars[j][0] == rightNum) {
            rightNum = vars[j][1];
            break;
          }
        }
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

  var specialOperators = ["sin", "cos", "tan"];
  for (var i = 0; i < specialOperators.length; i++) {
    if (formula.indexOf(specialOperators[i]) != -1) {
      opCount++;
    }
  }

  return opCount;
}

const storage = require('electron-storage');

ipcMain.on('recall:save', function(e, setName) {
  //deleteSet(e, setName);

  for (var i = 0; i < formulas.length; i++) {
    var data = { 'name': formulas[i][0],
                 'func': formulas[i][1] };
    var filePath = 'formulas/'+setName+'/func'+i+'.json';
    storage.set(filePath, data, (err) => {
      if (err) {
        console.error(err)
      }
    });
  }
});

ipcMain.on('recall:get', function(e, setName) {
  var i = 0;
  while (i < 25) {
    var filePath = 'formulas/'+setName+'/func'+i+'.json';
    storage.get(filePath, (err, data) => {
      if (err) {
        console.error(err);
      } else {
        formulas.push([data.name, data.func]);
        console.log("data is : " + data.name);
      }
    });

    i++;
  }
});

ipcMain.on('recall:clear', function(e, setName) {
  clearSet(e, setName);
});

function clearSet(e, setName) {
  var i = 0;
  while (i < 25) {
    var filePath = 'formulas/'+setName+'/func'+i+'.json';
    storage.remove(filePath, err => {
      if (err) {
        console.log(err)
      }
    });

    i++;
  }
}
