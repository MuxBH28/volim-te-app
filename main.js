const { app, BrowserWindow, screen, globalShortcut, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const Datastore = require('nedb');

let mainWindow;
let loadingWindow;
let db;

const gotSingleLock = app.requestSingleInstanceLock();

if (!gotSingleLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    ipcMain.on('update-auto-start', (event, shouldOpenAtLogin) => {
      app.setLoginItemSettings({
        openAtLogin: shouldOpenAtLogin,
      });
    });

    db = new Datastore({ filename: 'nedb.db', autoload: true });
    createLoadingWindow();
    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });

    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      globalShortcut.unregisterAll();
    });

  });

}

function createLoadingWindow() {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find(display => display.bounds.x === 0 && display.bounds.y === 0) || displays[0];
  const { workArea } = targetDisplay;

  loadingWindow = new BrowserWindow({
    x: workArea.x + workArea.width - 600,
    y: workArea.y,
    width: 600,
    height: 300,
    frame: false,
    skipTaskbar: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  loadingWindow.loadFile('src/loading.html');

  setTimeout(() => {
    loadingWindow.hide();
    createWindow();
  }, 3500);
}

function createWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find(display => display.bounds.x === 0 && display.bounds.y === 0) || displays[0];
  const { workArea } = targetDisplay;
  const windowWidth = 600;
  const windowHeight = 300;

  const x = workArea.width - windowWidth;
  const y = workArea.y;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    autoHideMenuBar: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    x,
    y,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      devTools: false,
      webSecurity: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["self"],
          scriptSrc: ["self", "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"],
          styleSrc: ["self"],
          imgSrc: ["self"],
          fontSrc: ["self"],
          objectSrc: ["self"],
        },
      },
    },
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => { });

ipcMain.on('focusWindow', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

ipcMain.on('open-file-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedImagePath = result.filePaths[0];

    const destinationFolder = path.join(app.getPath('userData'), 'images');

    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder);
    }

    const fileName = path.basename(selectedImagePath);

    const destinationPath = path.join(destinationFolder, fileName);

    fs.copyFileSync(selectedImagePath, destinationPath);

    event.reply('file-dialog-closed', destinationPath);
  }
});

function showUpdateAvailableDialog() {
  const options = {
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 0,
    title: 'Update Available',
    message: 'A new version of the app is available. Would you like to update?',
  };

  return dialog.showMessageBox(null, options);
}

autoUpdater.on('update-available', () => {
  showUpdateAvailableDialog().then(({ response }) => {
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Update Downloaded',
    message: 'The update has been downloaded and is ready to be installed. The app will restart.',
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (error) => {
  dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Update Error',
    message: `An error occurred while checking for updates: ${error.message}`,
  });
});

ipcMain.on('save-memory', (event, memoryData) => {
  db.insert(memoryData, (err, newMemory) => {
    if (err) {
      console.error('Error saving memory:', err);
      return;
    }

    event.sender.send('memory-saved', newMemory);
  });
});

ipcMain.on('fetch-memories', (event) => {
  db.find({}, (err, memories) => {
    if (err) {
      console.error('Error fetching memories:', err);
      return;
    }

    event.sender.send('memories-fetched', memories);
  });
});

ipcMain.on('delete-memory', (event, memoryId) => {
  const confirmationDel = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Volim Te App asks:',
    message: 'Are you sure you want to delete this memory?',
  });

  if (confirmationDel === 0) {
    db.remove({ _id: memoryId }, {}, (err, numRemoved) => {
      if (err) {
        console.error('Error deleting memory:', err);
        return;
      }

      event.sender.send('memory-deleted', memoryId);
    });
  }
});
ipcMain.on('clear-data-request', () => {
  db.remove({}, { multi: true });
});

ipcMain.on('app-quit', (event) => {
  const confirmation = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Volim Te App asks:',
    message: 'Are you sure you want to leave Volim Te App?',
  });

  if (confirmation === 0) {
    app.quit();
  }
});

ipcMain.on('ask-reset', async (event) => {
  const confirmation = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Confirmation',
    message: 'Are you sure you want to reset settings?',
  });
  event.reply('reset-confirmation', confirmation.response === 0);
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  db.persistence.compactDatafile();
});
