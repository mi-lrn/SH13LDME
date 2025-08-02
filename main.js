const { app, BrowserWindow, ipcMain, dialog, Menu, session, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
//imports
ipcMain.handle('copy-reg', (event, filePath, copyPath, name) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(copyPath, { recursive: true }, (err) => {
            if (err) {
                reject(err);
            }
        });
        fs.copyFile(filePath, copyPath + "/" + name, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(name);
            }
        });
    });
});
//copy json registry data file to another directory
ipcMain.handle('display-dialog', (event, title, message) => {
    return new Promise((resolve, reject) => {
        dialog.showMessageBox(mainWindow, {
            type: 'error',
            buttons: ['OK'],
            title: title,
            message: message,
        }).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        });
    });
});
//displays errors using a custom message box
ipcMain.handle('log-error', (event, filePath, error) => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${error}\n`;
        fs.appendFile(filePath, logMessage, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});
//logs fatal errors in a log file
ipcMain.handle('open-external', async (event, url) => {
    return new Promise(async (resolve, reject) => {
        try {
            await shell.openExternal(url);
            resolve();
        } catch (err) {
            reject(err);
        }
    });
});
//opens a link in a user's external browser to prevent security issues
ipcMain.handle('open-folder', async (event, dirPath) => {
    return new Promise(async (resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (err) => {
            if (err) {
                reject(err);
            }
        });
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            defaultPath: path.resolve(dirPath),
        });
        if (!result.canceled) {
            resolve(result.filePaths[0]);
        }
        else {
            resolve("");
        }
    });
});
//opens file explorer in a certain directory
ipcMain.handle('powershell', (event, command, bulk) => {
    return new Promise((resolve, reject) => {
        const powershell = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command]);
        let output = '';
        let errorOutput = '';
        powershell.stdout.on('data', (data) => {
            output += data.toString();
        });
        powershell.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        powershell.on('close', (code) => {
            if (code !== 0) {
                reject(errorOutput);
            } else if (bulk) {
                try {
                    const results = JSON.parse(output);
                    resolve(results);
                } catch (parseError) {
                    reject(parseError);
                }
            }
            //if there are multiple commands being executed in a bulk command parse the output as JSON
            else {
                resolve(output);
            }
        });
    });
});
//handles powershell commands and outputs
ipcMain.handle('read-reg', (event, filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            let jsonData;
            try {
                jsonData = JSON.parse(data);
                if (jsonData && jsonData.keys && Array.isArray(jsonData.keys)) {
                    resolve(jsonData.keys);
                } else {
                    resolve([]);
                }
                //check if json data exists and has the keys property
            } catch (parseError) {
                const emptyStructure = { keys: [] };
                fs.writeFile(filePath, JSON.stringify(emptyStructure, null, 2), (writeErr) => {
                    if (writeErr) {
                        reject(parseError);
                    } else {
                        resolve([]);
                    }
                });
                //if json parsing fails try to reset the registry file back to an empty structure
            }
        });
    });
});
//read json registry data file
ipcMain.handle('reset-reg', (event, filePath) => {
    return new Promise((resolve, reject) => {
        const resetData = JSON.stringify({keys: []}, null, 2);
        fs.writeFile(filePath, resetData, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});
//reset json registry data file
ipcMain.handle('write-reg', (event, filePath, endpointsArray) => {
    return new Promise((resolve, reject) => {
        const jsonData = { keys: endpointsArray };
        const jsonString = JSON.stringify(jsonData, null, 2);
        fs.writeFile(filePath, jsonString, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});
//writes json registry endpoint data to a file
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: true
        }
    });
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const isLocalRequest = details.url.startsWith('file://');
        if (isLocalRequest) {
        callback({ cancel: false });
        } else {
        callback({ cancel: true });
        }
    });
    //prevent remote content from being loaded into the app
    mainWindow.loadFile('index.html');
}
//start a new secure browser window to host the electron app
Menu.setApplicationMenu(null);
app.enableSandbox();
app.whenReady().then(createWindow);
app.disableHardwareAcceleration();
//sets up the application with the required tweaks
