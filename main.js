const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  
  // Open DevTools during development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for file operations
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-settings', async () => {
  try {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return { success: true, settings };
    } else {
      return { success: false, error: 'Settings file not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Task persistence handlers
ipcMain.handle('save-tasks', async (event, schedule) => {
  try {
    const tasksPath = path.join(__dirname, 'data', 'tasks.json');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(tasksPath, JSON.stringify(schedule, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-tasks', async () => {
  try {
    const tasksPath = path.join(__dirname, 'data', 'tasks.json');
    if (fs.existsSync(tasksPath)) {
      const schedule = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      return { success: true, schedule };
    } else {
      return { success: false, error: 'Tasks file not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export tasks to CSV
ipcMain.handle('export-tasks-to-csv', async (event, csvContent) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Schedule to CSV',
      defaultPath: path.join(app.getPath('documents'), 'pomodoro-schedule.csv'),
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    
    if (result.canceled) {
      return { success: false, error: 'Export canceled' };
    }
    
    fs.writeFileSync(result.filePath, csvContent);
    return { success: true, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-csv-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  
  if (result.canceled) {
    return { success: false, error: 'Selection canceled' };
  }
  
  try {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});