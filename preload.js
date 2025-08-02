const { contextBridge, ipcRenderer } = require('electron');
//imports
contextBridge.exposeInMainWorld('api', {
    copyRegistry: (filePath, copyPath, name) => ipcRenderer.invoke('copy-reg', filePath, copyPath, name),
    displayDialog: (title, message) => ipcRenderer.invoke('display-dialog', title, message),
    logError: (filePath, error) => ipcRenderer.invoke('log-error', filePath, error),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    openFolder: (dirPath) => ipcRenderer.invoke('open-folder', dirPath),
    powerShell: (command, bulk) => ipcRenderer.invoke('powershell', command, bulk),
    readRegistry: (filePath) => ipcRenderer.invoke('read-reg', filePath),
    resetRegistry: (filePath) => ipcRenderer.invoke('reset-reg', filePath),
    writeRegistry: (filePath, data) => ipcRenderer.invoke('write-reg', filePath, data)
});
//expose main.js apis to renderer process so it can interact with the system
