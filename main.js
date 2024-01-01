const { app, BrowserWindow, screen, globalShortcut, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let loadingWindow;

const gotSingleLock = app.requestSingleInstanceLock();

if (!gotSingleLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
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

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.on('upload-image', (event, imageInfo) => {
  const targetPath = path.join(app.getPath('userData'), 'images', imageInfo.filename);

  fs.copyFile(imageInfo.originalPath, targetPath, (err) => {
    if (err) {
      dialog.showErrorBox('Error', 'Failed to upload image');
      return;
    }

    dialog.showMessageBox({ message: 'Image uploaded successfully!' });

    if (mainWindow) {
      mainWindow.webContents.send('image-uploaded', { imagePath: targetPath });
    }
  });
});

ipcMain.on('app-quit', () => {
  quitApp();
});

function quitApp() {
  const confirmation = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Confirmation',
    message: 'Are you sure you want to leave the app?',
  });

  if (confirmation === 0) {
    app.quit();
  }
}
