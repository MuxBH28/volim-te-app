const { app, BrowserWindow, screen, globalShortcut, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb');
const prompt = require('electron-prompt');
const documentsPathDB = path.join(app.getPath('documents'), 'Volim Te App', 'Databases');
const { Client } = require('discord-rpc');

let windowWidth = 600;
let windowHeight = 300;
let mainWindow;
let loadingWindow;
const dbFilePath = path.join(documentsPathDB, 'nedb.db');
const settingsDBFilePath = path.join(documentsPathDB, 'settings.db');
const userDBFilePath = path.join(documentsPathDB, 'user.db');
const statsFilePath = path.join(documentsPathDB, 'stats.db');
const memoriesFilePath = path.join(documentsPathDB, 'milestones.db');
const gotSingleLock = app.requestSingleInstanceLock();
const clientId = '1231218760590032897';

let db;
let settingsDB;
let userDB;
let statsDB;
let milestonesDB;
let rpc;

if (!gotSingleLock) {
  app.quit();
} else {
  app.whenReady().then(() => {

    db = new Datastore({ filename: dbFilePath, autoload: true });
    settingsDB = new Datastore({ filename: settingsDBFilePath, autoload: true });
    userDB = new Datastore({ filename: userDBFilePath, autoload: true });
    statsDB = new Datastore({ filename: statsFilePath, autoload: true });
    milestonesDB = new Datastore({ filename: memoriesFilePath, autoload: true });

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
          devTools: true,
          hardwareAcceleration: false,
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
          hardwareAcceleration: false,
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

ipcMain.on('save-memory', (event, memoryData) => {
  db.insert(memoryData, (err, newMemory) => {
    if (err) {
      console.error('Error saving memory:', err);
      return;
    }
    statsDB.update({}, { $inc: { memoriesMade: 1 } }, { upsert: true }, (err, numReplaced) => {
      if (err) {
        console.error('Error updating memories made count:', err);
        return;
      }

      console.log('Memories made count updated in the database');
    });
    event.sender.send('memory-saved', newMemory);
  });
});
ipcMain.on('save-milestone', (event, milestoneData) => {
  milestonesDB.insert(milestoneData, (err, newMilestone) => {
    if (err) {
      console.error('Error saving milestone:', err);
      return;
    }
    statsDB.update({}, { $inc: { milestonesMade: 1 } }, { upsert: true }, (err, numReplaced) => {
      if (err) {
        console.error('Error updating milestones made count:', err);
        return;
      }

      console.log('Milestones made count updated in the database');
    });
    event.sender.send('milestone-saved', newMilestone);
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

ipcMain.on('fetch-milestones', (event) => {
  milestonesDB.find({}, (err, milestones) => {
    if (err) {
      console.error('Error fetching milestones:', err);
      return;
    }

    event.sender.send('milestones-fetched', milestones);
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

ipcMain.on('delete-milestone', (event, milestoneId) => {
  const confirmationDel = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Volim Te App asks:',
    message: 'Are you sure you want to delete this milestone?',
  });

  if (confirmationDel === 0) {
    milestonesDB.remove({ _id: milestoneId }, {}, (err, numRemoved) => {
      if (err) {
        console.error('Error deleting milestone:', err);
        return;
      }

      event.sender.send('milestone-deleted', milestoneId);
    });
  }
});

ipcMain.on('clear-database', () => {
  db.remove({}, { multi: true });
  settingsDB.remove({}, { multi: true });
  userDB.remove({}, { multi: true });
  statsDB.remove({}, { multi: true });
  milestonesDB.remove({}, { multi: true });
});

ipcMain.on('configure-window-size', (event) => {
  try {
    const prompt = require('electron-prompt');

    prompt({
      title: 'Enter the width and height for the app (comma-separated)',
      icon: './src/images/icon.ico',
      label: 'Changing width and height will lead to unexpected layout issues if done wrong',
      value: windowWidth + ',' + windowHeight,
      inputAttrs: {
        type: 'text',
      },
      type: 'input',
      width: 650,
      height: 200,
      alwaysOnTop: true,
    })
      .then((result) => {
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
      })
      .catch((error) => {
        console.error('Error configuring window size:', error);
      });
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
ipcMain.on('change-username', (event) => {
  prompt({
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
  })
    .then((result) => {
      if (result === null) {
        console.error('User canceled the operation.');
        return;
      }

      const newUsername = result;
      userDB.update({}, { $set: { username: newUsername } }, { upsert: true }, (err, numReplaced) => {
        if (err) {
          console.error('Error updating username:', err);
          return;
        }

        console.log('Username saved in the database:', newUsername);
        mainWindow.webContents.send('username-saved', newUsername);
      });
    })
    .catch((error) => {
      console.error('Error updating username:', error);
    });
});
ipcMain.on('change-soulmate', (event) => {
  prompt({
    title: 'Volim Te App',
    icon: './src/images/icon.ico',
    label: 'Please enter the name of a soulmate:',
    value: 'Your Love',
    inputAttrs: {
      type: 'text',
    },
    type: 'input',
    width: 470,
    height: 200,
    alwaysOnTop: true,
  })
    .then((result) => {
      if (result === null) {
        console.error('User canceled the operation.');
        return;
      }

      const newSoulmate = result;
      userDB.update({}, { $set: { soulmate: newSoulmate } }, { upsert: true }, (err, numReplaced) => {
        if (err) {
          console.error('Error updating soulmate:', err);
          return;
        }

        console.log('Soulmate saved in the database:', newSoulmate);
        mainWindow.webContents.send('soulmate-saved', newSoulmate);
      });
    })
    .catch((error) => {
      console.error('Error updating soulmate:', error);
    });
});

ipcMain.on('start-discord', (event) => {
  rpc = new Client({ transport: 'ipc' });
  rpc.on('ready', () => {
    console.log('Discord RPC client is ready');
    event.sender.send('discord-status', 'online');

    const presenceData = {
      state: 'In a relationship',
      details: 'Enjoying',
      largeImageKey: 'untitled-1',
      largeImageText: 'www.sehic.rf.gd/volimte',
      startTimestamp: Math.floor(Date.now() / 1000),
    };

    rpc.setActivity(presenceData)
      .then(() => console.log('Rich Presence updated'))
      .catch(error => console.error('Error updating Rich Presence:', error));
  });

  rpc.on('error', error => {
    console.error('Discord RPC client error:', error);
    event.sender.send('discord-status', 'error');
  });

  rpc.login({ clientId }).catch(error => {
    console.error('Error logging in to Discord:', error);
    event.sender.send('discord-status', 'error');
  });
});

ipcMain.on('stop-discord', (event) => {
  if (rpc) {
    rpc.destroy();
    console.log('Disconnected from Discord RPC');
    event.sender.send('discord-status', 'offline');
  } else {
    console.warn('Discord RPC client is not initialized');
    event.sender.send('discord-status', 'offline');
  }
});



function generatePdf(type, lang, username, soulmate) {
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
      message: 'Please select a language for your card.',
    });
    pdfWindow.close();
    return;
  }

  pdfWindow.webContents.on('did-finish-load', () => {
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

    setTimeout(() => {
      pdfWindow.webContents.printToPDF(pdfOptions, (error, pdfBuffer) => {
        if (error) {
          console.error('Error generating PDF:', error);
          return;
        }

        console.log('PDF generated successfully.');

        const pdfFolderPath = path.join(app.getPath('documents'), 'Volim Te App', 'Cards');
        if (!fs.existsSync(pdfFolderPath)) {
          fs.mkdirSync(pdfFolderPath, { recursive: true });
        }

        const pdfFilePath = path.join(pdfFolderPath, type + '-language-' + lang + '-volim-te-app.pdf');
        fs.writeFile(pdfFilePath, pdfBuffer, (error) => {
          if (error) {
            console.error('Error saving PDF:', error);
            return;
          }

          console.log('PDF saved to:', pdfFilePath);

          pdfWindow.close();

          require('electron').shell.openPath(pdfFilePath);

          console.log('PDF window closed.');
        });
      });
    }, 1000);
  });
}

ipcMain.on('generate-pdf', (event, args) => {
  console.log('Received generate-pdf message:', args);

  const { type, lang, username, soulmate } = args;
  generatePdf(type, lang, username, soulmate);
  statsDB.update({}, { $inc: { generatedCards: 1 } }, { upsert: true }, (err, numReplaced) => {
    if (err) {
      console.error('Error updating generated cards count:', err);
      return;
    }

    console.log('Generated cards count updated in the database');
  });
});

//stats
ipcMain.on('update-stats', (event, formattedTodaysDate) => {
  statsDB.update({}, { $set: { dateJoined: formattedTodaysDate } }, { upsert: true }, (err, numReplaced) => {
    if (err) {
      console.error('Error updating stats:', err);
      return;
    }

    console.log('Stats updated in the database with today\'s date:', formattedTodaysDate);
    event.sender.send('stats-updated', formattedTodaysDate);
  });
});
ipcMain.on('update-launch-count', () => {
  statsDB.update({}, { $inc: { launchCount: 1 } }, { upsert: true }, (err, numReplaced) => {
    if (err) {
      console.error('Error updating launch count:', err);
      return;
    }

    console.log('Launch count updated in the database');
  });
});

function updateBackgroundStat() {
  statsDB.update({}, { $inc: { backgroundsStat: 1 } }, { upsert: true }, (err, numReplaced) => {
    if (err) {
      console.error('Error updating backgrounds stat:', err);
      return;
    }
    console.log('Backgrounds stat updated in the database');
  });
}
ipcMain.on('open-file-dialog', (event) => {
  const destinationFolder = path.join(app.getPath('documents'), 'Volim Te App', 'Images');

  dialog.showOpenDialog({
    defaultPath: destinationFolder,
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    ],
  })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedImagePath = result.filePaths[0];

        if (!fs.existsSync(destinationFolder)) {
          fs.mkdirSync(destinationFolder, { recursive: true });
        }

        const fileName = path.basename(selectedImagePath);

        const destinationPath = path.join(destinationFolder, fileName);

        fs.copyFileSync(selectedImagePath, destinationPath);

        event.reply('file-dialog-closed', destinationPath);
        updateBackgroundStat();
      }
    })
    .catch((error) => {
      console.error('Error opening file dialog:', error);
    });
});

ipcMain.on('update-backgrounds-stat', () => {
  updateBackgroundStat();
});

ipcMain.on('request-stats', (event) => {
  statsDB.findOne({}, (err, stats) => {
    if (err) {
      console.error('Error fetching stats:', err);
      return;
    }
    event.sender.send('stats-response', stats || { dateJoined: null, launchCount: 0, generatedCards: 0, memoriesMade: 0, milestonesMade: 0, backgroundsStat: 0 });
  });
});
ipcMain.on('update-available', (event) => {
  const confirmation = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Volim Te App asks:',
    message: 'New update is available. Update now?',
  });

  if (confirmation === 0) {
    shell.openExternal('https://sehic.rf.gd/volimte#download');
  }
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

ipcMain.on('ask-reset', (event) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Reset', 'Cancel'],
    defaultId: 1,
    icon: './src/images/icon-uninstaller.ico',
    title: 'Confirmation',
    message: 'Are you sure you want to reset settings?',
  })
    .then((confirmation) => {
      event.reply('reset-confirmation', confirmation.response === 0);
    })
    .catch((error) => {
      console.error('Error showing reset confirmation dialog:', error);
    });
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  db.persistence.compactDatafile();
  settingsDB.persistence.compactDatafile();
  userDB.persistence.compactDatafile();
  statsDB.persistence.compactDatafile();
});
