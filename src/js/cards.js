document.addEventListener('DOMContentLoaded', function () {
    ipcRenderer.send('check-username-exists');
    ipcRenderer.send('check-soulmate-exists');
    const languageStorage = localStorage.getItem('language');
    if (languageStorage === 'ba') {
        baBtn.style.opacity = '100%';
        engBtn.style.opacity = '50%';
    }
    else if (languageStorage === 'eng') {
        baBtn.style.opacity = '50%';
        engBtn.style.opacity = '100%';
    }

    ipcRenderer.once('username-exists-response', (event, username) => {
        if (!username) {
            const generatedUsername = generateUsername();
            ipcRenderer.send('save-username', generatedUsername);
            document.getElementById('username').innerText = generatedUsername;
        } else {
            document.getElementById('username').innerText = username;
        }
    });
    ipcRenderer.once('soulmate-exists-response', (event, soulmate) => {
        if (!soulmate) {
            const generatedSoulmate = generateSoulmate();
            ipcRenderer.send('save-soulmate', generatedSoulmate);
            document.getElementById('soulmate').innerText = generatedSoulmate;
        } else {
            document.getElementById('soulmate').innerText = soulmate;
        }
    });
});

function generateUsername() {
    const username = 'Your Name';
    return username;
}
function generateSoulmate() {
    const soulmate = 'Your Love';
    return soulmate;
}

function changeUsername() {
    ipcRenderer.send('change-username');
    ipcRenderer.on('username-saved', (event, newUsername) => {
        document.getElementById('username').innerText = newUsername;
    });
}
function changeSoulmate() {
    ipcRenderer.send('change-soulmate');
    ipcRenderer.on('soulmate-saved', (event, newSoulmate) => {
        document.getElementById('soulmate').innerText = newSoulmate;
    });
}
function setLanguage(language) {
    let baBtn = document.getElementById('baBtn');
    let engBtn = document.getElementById('engBtn');

    if (language === 'ba') {
        baBtn.style.opacity = '100%';
        engBtn.style.opacity = '50%';
        localStorage.setItem('language', language);
    }
    else if (language === 'eng') {
        baBtn.style.opacity = '50%';
        engBtn.style.opacity = '100%';
        localStorage.setItem('language', language);
    }

}
async function generateCard(type) {
    const username = document.getElementById('username').innerText;
    const soulmate = document.getElementById('soulmate').innerText;
    const lang = localStorage.getItem('language');

    ipcRenderer.send('generate-pdf', { type, lang, username, soulmate });
    updateStatistics();
}