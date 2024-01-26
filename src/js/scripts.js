const { ipcRenderer, remote, app } = require('electron');
const path = require('path');
const fs = require('fs');
const electron = require('electron');
document.addEventListener('DOMContentLoaded', function () {
    const popupContainer = document.getElementById('popup-container');
    let fixedDateElement = document.getElementById('fixed-date');
    const acceptButton = document.getElementById('accept-button');
    const leaveButton = document.getElementById('leave-button');
    const dynamicDateElement = document.getElementById('dynamic-date');
    let backgroundImage = document.getElementById('background-image');
    const hasAccepted = localStorage.getItem('hasAccepted');
    let autoStartSwitch = document.getElementById('autoStartSwitch');
    const autoStartValue = localStorage.getItem('autoStart');

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
        document.getElementById('current-image').src = 'images/bg.JPG';
    }
    else {
        backgroundImage.src = `file://${customBackground}`;
        document.getElementById('current-image').src = `file://${customBackground}`;
    }
    if (autoStartValue === null || autoStartValue === 'true') {
        autoStartSwitch.checked = true;
        setAutoStart();

    } else {
        autoStartSwitch.checked = false;
        setAutoStart();

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

function showNotifications() {
    var notificationsDiv = document.getElementById('notifications');
    notificationsDiv.style.display = 'block';
    notificationsDiv.offsetHeight;
    notificationsDiv.style.opacity = 1;
}

function hideNotifications() {
    var notificationsDiv = document.getElementById('notifications');
    notificationsDiv.style.opacity = 0;

    setTimeout(function () {
        notificationsDiv.style.display = 'none';
    }, 500);
}
function showMemories() {
    var memoriesDiv = document.getElementById('memories');
    memoriesDiv.style.display = 'block';
    memoriesDiv.offsetHeight;
    memoriesDiv.style.opacity = 1;
}

function hideMemories() {
    var memoriesDiv = document.getElementById('memories');
    memoriesDiv.style.opacity = 0;

    setTimeout(function () {
        memoriesDiv.style.display = 'none';
    }, 500);
}
function showNewMemory() {
    var memoriesDiv = document.getElementById('newMemoryBox');
    memoriesDiv.style.display = 'block';
    memoriesDiv.offsetHeight;
    memoriesDiv.style.opacity = 1;
}

function hideNewMemory() {
    var newmemoriesDiv = document.getElementById('newMemoryBox');
    newmemoriesDiv.style.opacity = 0;

    setTimeout(function () {
        newmemoriesDiv.style.display = 'none';
    }, 500);
}
function hideReminder() {
    var reminderpopupDiv = document.getElementById('reminderPopup');
    reminderpopupDiv.style.opacity = 0;

    setTimeout(function () {
        reminderpopupDiv.style.display = 'none';
    }, 500);
}
function hideReminderB() {
    var BreminderpopupDiv = document.getElementById('BreminderPopup');
    BreminderpopupDiv.style.opacity = 0;

    setTimeout(function () {
        BreminderpopupDiv.style.display = 'none';
    }, 500);
}
function showCards() {
    var cardsDiv = document.getElementById('cards');
    cardsDiv.style.display = 'block';
    cardsDiv.offsetHeight;
    cardsDiv.style.opacity = 1;
}

function hideCards() {
    var cardsDiv = document.getElementById('cards');
    cardsDiv.style.opacity = 0;

    setTimeout(function () {
        cardsDiv.style.display = 'none';
    }, 500);
}
function uploadImage() {
    ipcRenderer.send('open-file-dialog');

    ipcRenderer.on('file-dialog-closed', (event, filePath) => {
        console.log('Selected image path:', filePath);

        localStorage.setItem('customBackground', filePath);
        document.getElementById('inputFileID').innerHTML = 'Background uploaded!';
        document.getElementById('current-image').src = `file://${filePath}`;
        setTimeout(function () {
            location.reload();
        }, 1000);
    });
}

function setAutoStart() {
    let autoStartSwitch = document.getElementById('autoStartSwitch');

    ipcRenderer.send('update-auto-start', autoStartSwitch.checked);

    localStorage.setItem('autoStart', autoStartSwitch.checked);
}
function configureAppSize() {
    let autoStartSwitch = document.getElementById('configureWindowSizeButton');

    ipcRenderer.send('configure-window-size');
    autoStartSwitch.innerHTML = "Done!"
    setTimeout(function () {
        autoStartSwitch.innerHTML = "Configure Window size"
    }, 1000);
}

function resetSettings() {
    ipcRenderer.send('ask-reset');

    ipcRenderer.on('reset-confirmation', (event, isConfirmed) => {
        const resetButton = document.getElementById('reset-button');

        if (resetButton) {
            if (isConfirmed) {
                resetButton.value = 'Done!';
                ipcRenderer.send('clear-database');
                ['pocetakVezeDate', 'hasAccepted', 'customBackground', 'autoStart', 'notifications', 'week-before', 'ann-notifications', 'desktop-notifications', 'birthday-notifications', 'notificationPreferenceDesktop', 'rodjendan', 'language'].forEach(key => localStorage.removeItem(key));
                setTimeout(quitApp, 1000);
            } else {
                resetButton.value = 'Cancelled!';
                setTimeout(() => resetButton.value = 'Reset App', 1000);
            }
        }
    });
}


function quitApp() {
    ipcRenderer.send('app-quit');
}