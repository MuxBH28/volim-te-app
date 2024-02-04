const { app, BrowserWindow, screen, globalShortcut, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb');
const prompt = require('electron-prompt');

let windowWidth = 600;
let windowHeight = 300;
let mainWindow;
let loadingWindow;
let db;
let settingsDB;
let userDB;
const gotSingleLock = app.requestSingleInstanceLock();

if (!gotSingleLock) {
  app.quit();
} else {
  app.whenReady().then(() => {

    db = new Datastore({ filename: './src/databases/nedb.db', autoload: true });
    settingsDB = new Datastore({ filename: './src/databases/settings.db', autoload: true });
    userDB = new Datastore({ filename: './src/databases/user.db', autoload: true });

    settingsDB.findOne({}, (err, doc) => {
      if (err) {
        console.error('Error fetching configured window size from database:', err);
        return;
      }

      if (doc && doc.width && doc.height) {
        windowWidth = doc.width;
        windowHeight = doc.height;
        console.log('Visina:  -> ' + windowHeight);
        console.log('Sirina:  -> ' + windowWidth);
        createLoadingWindow();
      } else {
        createLoadingWindow();
      }
    });

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
    x: workArea.x + workArea.width - windowWidth,
    y: workArea.y,
    width: windowWidth,
    height: windowHeight,
    frame: false,
    skipTaskbar: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  settingsDB.findOne({}, (err, doc) => {
    if (!err && doc && doc.x && doc.y) {
      loadingWindow.setPosition(doc.x, doc.y);
    }
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

  // Fetch the configured window location
  settingsDB.findOne({}, (err, doc) => {
    if (!err && doc && doc.x && doc.y) {
      const { x, y } = doc;

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
    } else {
      // Use default location if configuration is not available
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
ipcMain.on('clear-database', () => {
  db.remove({}, { multi: true });
  settingsDB.remove({}, { multi: true });
  userDB.remove({}, { multi: true });
});
ipcMain.on('configure-window-size', async (event) => {
  try {
    const result = await prompt({
      title: 'Enter the width and height for the app (comma-separated)',
      icon: './src/images/icon.ico',
      label: 'Changing width and height will lead to unexcpected layout issues if done wrong',
      value: windowWidth + ',' + windowHeight,
      inputAttrs: {
        type: 'text',
      },
      type: 'input',
      width: 650,
      height: 200,
      alwaysOnTop: true,
    });

    console.log('Prompt result:', result);

    if (result === null) {
      console.error('Invalid width or height input.');
      return;
    }

    const [width, height] = result.split(',').map(val => parseInt(val.trim(), 10) || 600);

    if (mainWindow) {
      mainWindow.setSize(width, height);
    }

    if (loadingWindow) {
      loadingWindow.setSize(width, height);
    }

    const configuredWindowSize = { width, height };

    settingsDB.update({}, configuredWindowSize, { upsert: true }, (err, numReplaced) => {
      if (err) {
        console.error('Error updating configured window size:', err);
        return;
      }

      console.log('Configured window size updated in the database:', configuredWindowSize);
    });

    console.log(`Configuring app with width: ${width}px, height: ${height}px`);
  } catch (error) {
    console.error('Error configuring window size:', error);
  }
});
ipcMain.on('configure-window-location', (event) => {
  try {
    if (mainWindow) {
      const [locationX, locationY] = mainWindow.getPosition();

      const configuredWindowLocation = { x: locationX, y: locationY };
      settingsDB.update({}, configuredWindowLocation, { upsert: true }, (err, numReplaced) => {
        if (err) {
          console.error('Error updating configured window location:', err);
          return;
        }

        console.log('Configured window location updated in the database:', configuredWindowLocation);
      });

      console.log(`Configuring app at X: ${locationX}px, Y: ${locationY}px`);
    }
  } catch (error) {
    console.error('Error configuring window location:', error);
  }
});

//CARDS
ipcMain.on('check-username-exists', (event) => {
  userDB.findOne({}, (err, doc) => {
    if (err) {
      console.error('Error checking username existence:', err);
      return;
    }

    event.reply('username-exists-response', doc ? doc.username : null);
  });
});
ipcMain.on('check-soulmate-exists', (event) => {
  userDB.findOne({}, (err, doc) => {
    if (err) {
      console.error('Error checking soulmate existence:', err);
      return;
    }

    event.reply('soulmate-exists-response', doc ? doc.soulmate : null);
  });
});

ipcMain.on('save-username', (event, username) => {
  userDB.update({}, { $set: { username } }, { upsert: true }, (err, numReplaced) => {
    if (err) {
      console.error('Error updating username:', err);
      return;
    }

    console.log('Username saved in the database:', username);
    mainWindow.webContents.send('username-saved', username);
  });
});
ipcMain.on('save-soulmate', (event, soulmate) => {
  userDB.update({}, { $set: { soulmate } }, { upsert: true }, (err, numReplaced) => {
    if (err) {
      console.error('Error updating soulmate:', err);
      return;
    }

    console.log('Soulmate saved in the database:', soulmate);
    mainWindow.webContents.send('soulmate-saved', soulmate);
  });
});

ipcMain.on('change-username', async (event) => {
  const result = await prompt({
    title: 'Volim Te App',
    icon: './src/images/icon.ico',
    label: 'Please enter your new username:',
    value: 'Your Name',
    inputAttrs: {
      type: 'text',
    },
    type: 'input',
    width: 470,
    height: 200,
    alwaysOnTop: true,
  });
  if (result === null) {
    console.error('Error updating username:', err);
    return;
  }
  else {
    const newUsername = result;
    userDB.update({}, { $set: { username: newUsername } }, { upsert: true }, (err, numReplaced) => {
      if (err) {
        console.error('Error updating username:', err);
        return;
      }

      console.log('Username saved in the database:', newUsername);
      mainWindow.webContents.send('username-saved', newUsername);
    });
  }
});

ipcMain.on('change-soulmate', async (event) => {
  const result = await prompt({
    title: 'Volim Te App',
    icon: './src/images/icon.ico',
    label: 'Please enter name of a soulmate:',
    value: 'Your Love',
    inputAttrs: {
      type: 'text',
    },
    type: 'input',
    width: 470,
    height: 200,
    alwaysOnTop: true,
  });
  if (result === null) {
    console.error('Error updating soulmate:', err);
    return;
  }
  else {
    const newSoulmate = result;
    userDB.update({}, { $set: { soulmate: newSoulmate } }, { upsert: true }, (err, numReplaced) => {
      if (err) {
        console.error('Error updating soulmate:', err);
        return;
      }

      console.log('Soulmate saved in the database:', newSoulmate);
      mainWindow.webContents.send('soulmate-saved', newSoulmate);
    });
  }
});
async function generatePdf(type, lang, username, soulmate) {
  console.log('Opening PDF window...');
  console.log('Language: ', lang);
  console.log('Type: ', type);
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  if (!(lang === null)) {
    if (type === 'cardBirthday') {
      if (lang === 'ba') {
        pdfWindow.loadFile('./src/cards/birthday-ba.html');
      }
      else if (lang === 'eng') {
        pdfWindow.loadFile('./src/cards/birthday-eng.html');
      }
    }
    else if (type === 'cardValentine') {
      if (lang === 'ba') {
        pdfWindow.loadFile('./src/cards/valentine-ba.html');
      }
      else if (lang === 'eng') {
        pdfWindow.loadFile('./src/cards/valentine-eng.html');
      }
    }
    else if (type === 'cardAnniversary') {
      if (lang === 'ba') {
        pdfWindow.loadFile('./src/cards/anniversary-ba.html');
      }
      else if (lang === 'eng') {
        pdfWindow.loadFile('./src/cards/anniversary-eng.html');
      }
    }
    else if (type === 'cardMarriageCertificate') {
      if (lang === 'ba') {
        pdfWindow.loadFile('./src/cards/marriage-cert-ba.html');
      }
      else if (lang === 'eng') {
        pdfWindow.loadFile('./src/cards/marriage-cert-eng.html');
      }
    }
    else if (type === 'cardApology') {
      if (lang === 'ba') {
        pdfWindow.loadFile('./src/cards/apology-ba.html');
      }
      else if (lang === 'eng') {
        pdfWindow.loadFile('./src/cards/apology-eng.html');
      }
    }
  }
  else {
    dialog.showMessageBox({
      type: 'error',
      buttons: ['OK'],
      defaultId: 0,
      title: 'Volim Te App',
      message: 'Please select language for your card.',
    });
    pdfWindow.close();
    return;
  }
  await new Promise(resolve => pdfWindow.webContents.on('did-finish-load', resolve));

  console.log('PDF window loaded successfully.');
  pdfWindow.webContents.executeJavaScript(`
    var username = decodeURIComponent('${encodeURIComponent(username)}');
    var soulmate = decodeURIComponent('${encodeURIComponent(soulmate)}');
    document.getElementById('soulmate').innerText = soulmate;
    document.getElementById('username').innerText = username;
  `);
  pdfWindow.webContents.send('set-parameters', { username, soulmate });

  console.log('Parameters sent to renderer process.');
  console.log('Parameters injected into HTML.');

  // Generate PDF
  const pdfOptions = {
    landscape: false,
    marginsType: 1,
    printBackground: true,
    printSelectionOnly: false,
    pageSize: 'A4',
    scaleFactor: 1,
  };

  console.log('Generating PDF...');

  await new Promise(resolve => setTimeout(resolve, 1000));

  const pdfBuffer = await pdfWindow.webContents.printToPDF(pdfOptions);

  console.log('PDF generated successfully.');

  const pdfFilePath = path.join(app.getPath('userData'), type + '-volim-te-app.pdf');
  fs.writeFileSync(pdfFilePath, pdfBuffer);

  console.log('PDF saved to:', pdfFilePath);

  pdfWindow.close();

  require('electron').shell.openPath(pdfFilePath);

  console.log('PDF window closed.');
}


ipcMain.on('generate-pdf', (event, args) => {
  console.log('Received generate-pdf message:', args);

  const { type, lang, username, soulmate } = args;
  generatePdf(type, lang, username, soulmate);
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
    buttons: ['Reset', 'Cancel'],
    defaultId: 1,
    icon: './src/images/icon-uninstaller.ico',
    title: 'Confirmation',
    message: 'Are you sure you want to reset settings?',
  });
  event.reply('reset-confirmation', confirmation.response === 0);
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  db.persistence.compactDatafile();
  settingsDB.persistence.compactDatafile();
  userDB.persistence.compactDatafile();
});
