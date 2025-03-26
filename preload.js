const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings operations
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // Task operations
  saveTasks: (schedule) => ipcRenderer.invoke('save-tasks', schedule),
  loadTasks: () => ipcRenderer.invoke('load-tasks'),
  exportTasksToCSV: (csvContent) => ipcRenderer.invoke('export-tasks-to-csv', csvContent),
  
  // File operations
  selectCSVFile: () => ipcRenderer.invoke('select-csv-file')
});