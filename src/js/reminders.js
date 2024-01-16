const moment = require('moment');
document.addEventListener('DOMContentLoaded', function () {
    let notificationsSwitch = document.getElementById('notificationSwitch');
    const notificationSwitchValue = localStorage.getItem('notifications');
    let weekBeforeSwitch = document.getElementById('weekBeforeSwitch');
    const weekBeforeSwitchValue = localStorage.getItem('week-before');
    let annNotificationSwitch = document.getElementById('annNotificationSwitch');
    const annNotificationSwitchValue = localStorage.getItem('ann-notifications');
    let desktopNotificationSwitch = document.getElementById('desktopNotificationSwitch');
    const desktopNotificationSwitchValue = localStorage.getItem('desktop-notifications');
    const birthdayNotificationSwitchValue = localStorage.getItem('birthday-notifications');
    let birthdayNotificationSwitch = document.getElementById('birthdayNotificationSwitch');
    let reminderPopup = document.getElementById('reminderPopup');
    let BreminderPopup = document.getElementById('BreminderPopup');
    let anniversarydayDiv = document.getElementById('anniversary-day');
    let anniversaryday7Div = document.getElementById('week-b4-anniversary-day');
    let birthdaydayDiv = document.getElementById('birthday-day');
    let birthdayday7Div = document.getElementById('week-b4-birthday-day');
    let numberOfYears = document.getElementById('number-of-years');
    let numberOfYearsBirth = document.getElementById('number-of-birthday-years');
    const notificationsDesktop = localStorage.getItem('notificationPreferenceDesktop');

    let birthdayDate = localStorage.getItem('rodjendan');
    let targetDate = localStorage.getItem('pocetakVezeDate');

    if (targetDate) {
        targetDate = new Date(targetDate);
    } else {
        targetDate = new Date('2003-12-28T00:00:00Z');
    }
    if (birthdayDate) {
        birthdayDate = new Date(birthdayDate);
    } else {
        birthdayDate = new Date('2003-12-28T00:00:00Z');
    }
    const todaysDate = new Date();
    const yearsPassedVeze = todaysDate.getFullYear() - targetDate.getFullYear();
    const yearsPassedBirth = todaysDate.getFullYear() - birthdayDate.getFullYear();

    //DODATI 8.mart 14. februar tkdzr
    if (notificationSwitchValue === 'true') {
        notificationsSwitch.checked = true;
    } else {
        notificationsSwitch.checked = false;
    }
    if (notificationSwitchValue === 'true' && weekBeforeSwitchValue === 'true') {
        weekBeforeSwitch.checked = true;
    } else {
        weekBeforeSwitch.checked = false;
    }
    if (notificationSwitchValue === 'true' && annNotificationSwitchValue === 'true') {
        annNotificationSwitch.checked = true;
    } else {
        annNotificationSwitch.checked = false;
    }
    if (notificationSwitchValue === 'true' && desktopNotificationSwitchValue === 'true') {
        desktopNotificationSwitch.checked = true;
    } else {
        desktopNotificationSwitch.checked = false;
    }
    if (notificationSwitchValue === 'true' && birthdayNotificationSwitchValue === 'true') {
        birthdayNotificationSwitch.checked = true;
    } else {
        birthdayNotificationSwitch.checked = false;
    }
    if (notificationsDesktop === 'true') {
        notificationsEnabled = true;
    } else {
        notificationsEnabled = false;
    }

    function updatePopupVisibility(element, isVisible) {
        element.classList.remove(isVisible ? 'hidden' : 'show');
        element.classList.add(isVisible ? 'show' : 'hidden');
    }

    if (notificationSwitchValue === 'true' && annNotificationSwitchValue === 'true' && isAnniversary(todaysDate, targetDate)) {
        console.log("Is Anniversary: true");
        updatePopupVisibility(reminderPopup, true);
        updatePopupVisibility(anniversarydayDiv, true);
        numberOfYears.innerHTML = `${yearsPassedVeze} year${yearsPassedVeze !== 1 ? 's' : ''}`;
        if (desktopNotificationSwitchValue === 'true') {
            const desktopNotificationAnniversary = new Notification('Volim Te App', {
                body: `It looks like someone has an anniversary today!`,
                icon: '../images/icon.png',
                image: '../images/godisnjica.png',
                requireInteraction: true,
            });
            desktopNotificationAnniversary.addEventListener('click', () => {
                ipcRenderer.send('focusWindow');
            });
        }
    } else if (notificationSwitchValue === 'true' && annNotificationSwitchValue === 'true' && weekBeforeSwitchValue === 'true' && is7DaysBeforeAnniversary(todaysDate, targetDate)) {
        console.log("Is 7 Days Before Anniversary: true");
        updatePopupVisibility(reminderPopup, true);
        updatePopupVisibility(anniversaryday7Div, true);
        if (desktopNotificationSwitchValue === 'true') {
            const desktopNotificationAnniversary7 = new Notification('Volim Te App', {
                body: `It looks like someone has an anniversary in 7 days!`,
                icon: '../images/icon.png',
                image: '../images/godisnjica.png',
                requireInteraction: true,
            });
            desktopNotificationAnniversary7.addEventListener('click', () => {
                ipcRenderer.send('focusWindow');
            });
        }
    } else {
        console.log("Anniversary condition not met");
        updatePopupVisibility(reminderPopup, false);
    }

    if (notificationSwitchValue === 'true' && birthdayNotificationSwitchValue === 'true' && isBirthday(todaysDate, birthdayDate)) {
        updatePopupVisibility(BreminderPopup, true);
        updatePopupVisibility(birthdaydayDiv, true);
        numberOfYearsBirth.innerHTML = `${yearsPassedBirth} year${yearsPassedBirth !== 1 ? 's' : ''}`;
        if (desktopNotificationSwitchValue === 'true') {
            const desktopNotificationBirthday = new Notification('Volim Te App', {
                body: `It looks like someone has a birthday today!`,
                icon: '../images/icon.png',
                image: '../images/birthday.png',
                requireInteraction: true,
            });
            desktopNotificationBirthday.addEventListener('click', () => {
                ipcRenderer.send('focusWindow');
            });
        }
    } else if (notificationSwitchValue === 'true' && birthdayNotificationSwitchValue === 'true' && weekBeforeSwitchValue === 'true' && is7DaysBeforeBirthday(todaysDate, birthdayDate)) {
        updatePopupVisibility(BreminderPopup, true);
        updatePopupVisibility(birthdayday7Div, true);
        if (desktopNotificationSwitchValue === 'true') {
            const desktopNotificationBirthday7 = new Notification('Volim Te App', {
                body: `It looks like someone has a birthday in 7 days!`,
                icon: '../images/icon.png',
                image: '../images/birthday.png',
                requireInteraction: true,
            });
            desktopNotificationBirthday7.addEventListener('click', () => {
                ipcRenderer.send('focusWindow');
            });
        }
    } else {
        updatePopupVisibility(BreminderPopup, false);
    }

});

function is7DaysBeforeBirthday(currentDate, birthdayDate) {
    const today = moment(currentDate);
    const birthday = moment(birthdayDate);

    const daysDifference = moment.duration(birthday.diff(today)).asDays();

    return daysDifference === 7;
}
function isBirthday(currentDate, birthdayDate) {
    return currentDate.getDate() === birthdayDate.getDate() && currentDate.getMonth() === birthdayDate.getMonth();
}


function is7DaysBeforeAnniversary(currentDate, anniversaryDate) {
    const today = moment(currentDate);
    const anniversary = moment(anniversaryDate);

    const daysDifference = moment.duration(anniversary.diff(today)).asDays();

    return daysDifference === 7;
}

function isAnniversary(currentDate, anniversaryDate) {
    const isAnniversary = currentDate.getDate() === anniversaryDate.getDate() && currentDate.getMonth() === anniversaryDate.getMonth();
    return isAnniversary;
}


function setNotifications() {
    let notificationsSwitch = document.getElementById('notificationSwitch');

    localStorage.setItem('notifications', notificationsSwitch.checked);
}
function setWeekBeforeSwitch() {
    let weekBeforeSwitch = document.getElementById('weekBeforeSwitch');

    localStorage.setItem('week-before', weekBeforeSwitch.checked);
}
function setAnnNotifications() {
    let annNotificationSwitch = document.getElementById('annNotificationSwitch');

    localStorage.setItem('ann-notifications', annNotificationSwitch.checked);
}
function setDesktopNotifications() {
    let desktopNotificationSwitch = document.getElementById('desktopNotificationSwitch');
    localStorage.setItem('desktop-notifications', desktopNotificationSwitch.checked);

}
function setBirthdayNotifications() {
    let birthdayNotificationSwitch = document.getElementById('birthdayNotificationSwitch');
    localStorage.setItem('birthday-notifications', birthdayNotificationSwitch.checked);
}


function saveDates() {
    let saveDatesButton = document.getElementById('saveDatesButton');
    let saveDatesSpan = document.getElementById('saveDatesSpan');
    const dateInput = document.getElementById('startDate').value;
    const birthdayInput = document.getElementById('birthdayDate').value;

    const targetDateInput = new Date(dateInput).toISOString();
    const birthdayDateInput = new Date(birthdayInput).toISOString();

    localStorage.setItem('pocetakVezeDate', targetDateInput);
    localStorage.setItem('rodjendan', birthdayDateInput);

    saveDatesButton.innerHTML = 'Saved!';
    saveDatesSpan.innerHTML = 'Restart is require for changes to take effect';
    setTimeout(function () {
        saveDatesButton.innerHTML = 'Save';
    }, 1500);
}