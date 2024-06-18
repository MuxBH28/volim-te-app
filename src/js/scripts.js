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
    const hasAccepted = localStorage.getItem('hasAccepted');
    let autoStartSwitch = document.getElementById('autoStartSwitch');
    const autoStartValue = localStorage.getItem('autoStart');
    let clockSwitch = document.getElementById('clockSwitch');
    const clockValue = localStorage.getItem('clock');
    let discordSwitch = document.getElementById('discordSwitch');
    const discordValue = localStorage.getItem('setDiscord');

    if (!hasAccepted) {
        popupContainer.style.display = 'block';
    }
    let targetDate = localStorage.getItem('pocetakVezeDate');
    if (targetDate) {
        targetDate = new Date(targetDate);
    } else {
        targetDate = new Date('2003-12-28T00:00:00Z');
    }
    if (autoStartValue === null || autoStartValue === 'true') {
        autoStartSwitch.checked = true;
        setAutoStart();

    } else {
        autoStartSwitch.checked = false;
        setAutoStart();

    }
    if (clockValue === null || clockValue === 'true') {
        clockSwitch.checked = true;
        setClock();
    } else {
        clockSwitch.checked = false;
        setClock();
    }
    if (discordValue === null || discordValue === 'true') {
        discordSwitch.checked = true;
        connectDiscord();
    } else {
        discordSwitch.checked = false;
    }

    acceptButton.addEventListener('click', function () {
        const dateInput = document.getElementById('pocetakveze').value;
        const targetDateInput = new Date(dateInput + 'T00:00:00Z');

        const todaysDate = new Date();
        const formattedTodaysDate = `${todaysDate.getDate()}.${todaysDate.getMonth() + 1}.${todaysDate.getFullYear()}`;
        localStorage.setItem('pocetakVezeDate', targetDateInput);
        localStorage.setItem('hasAccepted', true);
        popupContainer.style.display = 'none';
        targetDate = targetDateInput;
        ipcRenderer.send('update-stats', formattedTodaysDate);
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

function showMenu() {
    toggleButtonsContainer();
}

function toggleButtonsContainer() {
    const buttonsContainer = document.querySelector('.buttons-container');

    buttonsContainer.classList.toggle('show');
}

function showTab(tab) {
    let tabDiv = document.getElementById(tab);
    tabDiv.style.display = 'block';
    tabDiv.offsetHeight;
    tabDiv.style.opacity = 1;
    if (tab === 'news') {
        const newsIcon = document.querySelector('.fa-bullhorn');
        newsIcon.classList.remove('fa-beat');
        newsIcon.style.color = '';
        localStorage.setItem('userClickedNewsIcon', 'true');
    }
    if (tab === 'backgrounds' || tab === 'newMemoryBox' || tab === 'newMilestone' || tab === 'news' || tab === 'settings' || tab === 'info') {
        document.querySelector('.buttons-container').classList.remove('show');
    }
    else {
        toggleButtonsContainer();
    }
}
function hideTab(tab) {
    let tabDiv = document.getElementById(tab);
    tabDiv.style.opacity = 0;
    setTimeout(function () {
        tabDiv.style.display = 'none';
    }, 500);
}

function setAutoStart() {
    let autoStartSwitch = document.getElementById('autoStartSwitch');

    ipcRenderer.send('update-auto-start', autoStartSwitch.checked);

    localStorage.setItem('autoStart', autoStartSwitch.checked);
}
function setClock() {
    let clockSwitch = document.getElementById('clockSwitch');
    localStorage.setItem('clock', clockSwitch.checked);
}
function updateClock() {
    const clockSwitch = document.getElementById('clockSwitch');
    let clockText = document.getElementById('clock');
    if (clockSwitch.checked) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        clockText.textContent = timeString;
    }
    else {
        clockText.textContent = '';
    }
}
updateClock();
setInterval(updateClock, 1000);



function configureAppSize() {
    let autoStartSwitch = document.getElementById('configureWindowSizeButton');

    ipcRenderer.send('configure-window-size');
    autoStartSwitch.innerHTML = '<i class="fa-regular fa-circle-check"></i> Done!'
    setTimeout(function () {
        autoStartSwitch.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center"></i> App size'
    }, 1000);
}
function configureAppLocation() {
    let locationChooseSwitch = document.getElementById('configureWindowLocationButton');

    ipcRenderer.send('configure-window-location');
    locationChooseSwitch.innerHTML = '<i class="fa-regular fa-circle-check"></i> Done!'
    setTimeout(function () {
        locationChooseSwitch.innerHTML = '<i class="fa-solid fa-maximize"></i> App location'
    }, 1000);
}

function setDiscord() {
    let discordSwitch = document.getElementById('discordSwitch');
    localStorage.setItem('setDiscord', discordSwitch.checked);
    if (!discordSwitch.checked) {
        stopDiscord();
    }
}
function connectDiscord() {
    ipcRenderer.send('start-discord');

    let rcntDisc = document.getElementById('rcntDisc');
    let statusOfDiscord = document.getElementById('statusOfDiscord');

    ipcRenderer.on('discord-status', (event, status) => {
        if (status === 'online') {
            statusOfDiscord.innerHTML = "ONLINE"
        } else if (status === 'error') {
            statusOfDiscord.innerHTML = "OFFLINE"
        }
    });
}
function stopDiscord() {
    ipcRenderer.send('stop-discord');

    let statusOfDiscord = document.getElementById('statusOfDiscord');

    statusOfDiscord.innerHTML = "OFFLINE";
}


function shareApp() {
    let shareButton = document.getElementById("share-button");

    const link = "https://sehic.rf.gd/volimte";

    const copiedText = `Volim Te App \nCheck out this delightful application designed to cherish and celebrate the beautiful journey of love. \nMore info here: ${link}`;

    const textarea = document.createElement('textarea');
    textarea.value = copiedText;
    document.body.appendChild(textarea);

    textarea.select();
    document.execCommand('copy');

    document.body.removeChild(textarea);

    shareButton.innerHTML = '<i class="fa-solid fa-check"></i>';
    alert("Copied to clipboard!");
    setTimeout(() => {
        shareButton.innerHTML = '<i class="fa-solid fa-share-nodes"></i>';
    }, 1000);
}

function resetSettings() {
    ipcRenderer.send('ask-reset');

    ipcRenderer.on('reset-confirmation', (event, isConfirmed) => {
        const resetButton = document.getElementById('reset-button');

        if (resetButton) {
            if (isConfirmed) {
                resetButton.innerHTML = '<i class="fa-regular fa-circle-check"></i> Done!';
                ipcRenderer.send('clear-database');
                ['pocetakVezeDate', 'hasAccepted', 'customBackground', 'autoStart', 'notifications', 'week-before', 'ann-notifications', 'desktop-notifications', 'birthday-notifications', 'notificationPreferenceDesktop', 'rodjendan', 'language', 'newsCounter', 'userClickedNewsIcon', 'clock', 'setDiscord'].forEach(key => localStorage.removeItem(key));
                setTimeout(quitApp, 1000);
            } else {
                resetButton.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Cancelled!';
                setTimeout(() => resetButton.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i> Reset App', 1000);
            }
        }
    });
}

function quitApp() {
    ipcRenderer.send('app-quit');
}