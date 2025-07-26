const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ipcSend: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },
  ipcOn: (channel, listener) => {
    ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  ipcRemoveAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  clipboardWriteText: (text) => ipcRenderer.invoke('clipboard-write', text),
  fetchDataUrl: (url) => ipcRenderer.invoke('get-data-url', url),
});