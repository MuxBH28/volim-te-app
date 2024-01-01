const { ipcRenderer, remote, app } = require('electron');
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const { dialog } = electron;

document.addEventListener('DOMContentLoaded', function () {
    const popupContainer = document.getElementById('popup-container');
    let fixedDateElement = document.getElementById('fixed-date');
    const acceptButton = document.getElementById('accept-button');
    const leaveButton = document.getElementById('leave-button');
    const dynamicDateElement = document.getElementById('dynamic-date');
    let backgroundImage = document.getElementById('background-image');
    let inputFileID = document.getElementById('inputFileID');

    const hasAccepted = localStorage.getItem('hasAccepted');
    if (!hasAccepted) {
        popupContainer.style.display = 'block';
    }
    let targetDate = localStorage.getItem('pocetakVezeDate');
    if (targetDate) {
        targetDate = new Date(targetDate);
    } else {
        targetDate = new Date('2003-12-28T00:00:00Z');
    }
    const customBackground = localStorage.getItem('customBackground');
    if (!customBackground) {
        backgroundImage.src = 'images/bg.JPG';
    }

    acceptButton.addEventListener('click', function () {
        const dateInput = document.getElementById('pocetakveze').value;
        const targetDateInput = new Date(dateInput + 'T00:00:00Z');

        localStorage.setItem('pocetakVezeDate', targetDateInput);
        localStorage.setItem('hasAccepted', true);
        popupContainer.style.display = 'none';
        targetDate = targetDateInput;
    });

    leaveButton.addEventListener('click', function () {
        quitApp();
    });

    function updateTimer() {
        const now = new Date();

        if (now > targetDate) {
            const timeDifference = now - targetDate;
            dynamicDateElement.textContent = `${now.getDate()}. ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            fixedDateElement.textContent = `${targetDate.getDate()}. ${targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

            const { years, months, days } = getYearsMonthsAndDaysDifference(now, targetDate);
            const hours = Math.floor(timeDifference / (1000 * 60 * 60) % 24);
            const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
            const seconds = Math.floor((timeDifference / 1000) % 60);

            const timerElement = document.getElementById('timer');
            timerElement.innerHTML = `${years > 0 ? years + ' years, ' : ''}${months > 0 ? months + ' months, ' : ''}${days > 0 ? days + ' days, ' : ''}${hours} hours, ${minutes} minutes, ${seconds} seconds`;
        } else {
            dynamicDateElement.textContent = 'Date not set';
            fixedDateElement.textContent = 'ERROR!';

            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.innerHTML = 'Please reset app';
            }
        }
    }

    function getYearsMonthsAndDaysDifference(date1, date2) {
        let years = date1.getFullYear() - date2.getFullYear();
        let months = date1.getMonth() - date2.getMonth();
        let days = date1.getDate() - date2.getDate();

        if (days < 0) {
            const lastMonthDays = new Date(date1.getFullYear(), date1.getMonth(), 0).getDate();
            days += lastMonthDays;
            months--;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return {
            years: years >= 0 ? years : 0,
            months: months >= 0 ? months : 0,
            days: days >= 0 ? days : 0,
        };
    }

    setInterval(updateTimer, 1000);

    updateTimer();

    document.getElementById('close-btn').addEventListener('click', function () {
        quitApp();
    });

    document.getElementById('minimize-btn').addEventListener('click', function () {
        const window = remote.getCurrentWindow();
        window.minimize();
    });

    document.getElementById('maximize-restore-btn').addEventListener('click', function () {
        const window = remote.getCurrentWindow();
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    });
});

function showSettings() {
    var settingsDiv = document.getElementById('settings');
    settingsDiv.style.display = 'block';
    settingsDiv.offsetHeight;
    settingsDiv.style.opacity = 1;
}

function hideSettings() {
    var settingsDiv = document.getElementById('settings');
    settingsDiv.style.opacity = 0;

    setTimeout(function () {
        settingsDiv.style.display = 'none';
    }, 500);
}

function showInfo() {
    var infoDiv = document.getElementById('info');
    infoDiv.style.display = 'block';
    infoDiv.offsetHeight;
    infoDiv.style.opacity = 1;
}

function hideInfo() {
    var infoDiv = document.getElementById('info');
    infoDiv.style.opacity = 0;

    setTimeout(function () {
        infoDiv.style.display = 'none';
    }, 500);
}

function uploadImage() {
    const input = document.getElementById('imageInput');
    const filePath = input.files[0].path;

    const imagesFolderPath = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(imagesFolderPath)) {
        fs.mkdirSync(imagesFolderPath, { recursive: true });
    }

    const destinationFileName = `background${path.extname(filePath)}`;
    const destinationPath = path.join(imagesFolderPath, destinationFileName);

    fs.copyFileSync(filePath, destinationPath);

    const imageInfo = {
        filename: destinationFileName,
        originalPath: filePath,
        destinationPath: destinationPath,
    };

    ipcRenderer.send('upload-image', imageInfo);

    setBackgroundImage(destinationPath);
}

function setBackgroundImage(imagePath) {
    const backgroundImage = document.getElementById('backgroundImage');
    const inputFileID = document.getElementById('inputFileID');

    if (backgroundImage) {
        backgroundImage.src = `file://${imagePath}`;
    }
    localStorage.setItem('customBackground', true);
    inputFileID.innerHTML = 'Background uploaded!';
}

function resetSettings() {
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.value = 'Done!';
    }
    localStorage.removeItem('pocetakVezeDate');
    localStorage.removeItem('hasAccepted');
    localStorage.removeItem('customBackground');
    setTimeout(function () {
        quitApp();
    }, 1000);
}

function quitApp() {
    ipcRenderer.send('app-quit');
}