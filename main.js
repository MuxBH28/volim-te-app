const { app, BrowserWindow, screen, globalShortcut, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
let mainWindow;
let loadingWindow;

const gotSingleLock = app.requestSingleInstanceLock();
function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}
if (!gotSingleLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    app.setLoginItemSettings({
      openAtLogin: true,
    });
    createLoadingWindow();
    protocol.registerBufferProtocol('custom', (request, callback) => {
      const dataUrl = request.url.substr(11);
      const buffer = Buffer.from(dataUrl, 'base64');
      callback({ mimeType: 'image/png', data: buffer });
    });

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });

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
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  loadingWindow.loadFile('src/loading.html');

  setTimeout(() => {
    loadingWindow.hide();
    createWindow();
  }, 2500);
}

function createWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find(display => display.bounds.x === 0 && display.bounds.y === 0) || displays[0];
  const { workArea } = targetDisplay;
  const windowWidth = 600;//600
  const windowHeight = 300;//300

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
      devTools: true,
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


ipcMain.on('app-quit', (event) => {

  const confirmation = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Volim Te App asks:',
    message: 'Are you sure you want to leave Volim Te App?',
  });

  if (confirmation === 0) {
    globalShortcut.unregisterAll();
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
});