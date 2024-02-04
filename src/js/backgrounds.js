document.addEventListener('DOMContentLoaded', function () {
    let backgroundImage = document.getElementById('background-image');

    const customBackground = localStorage.getItem('customBackground');
    let currentImage = document.getElementById('current-image');
    let currentImageSelector = document.getElementById("bg" + customBackground);
    if (!customBackground || customBackground === '0') {
        // Default background
        backgroundImage.src = 'images/backgrounds/bg.jpg';
        currentImage.src = 'images/backgrounds/bg.jpg';
        currentImageSelector.classList.add("background-active");
    }
    else if (customBackground > 0 && customBackground < 11) {
        // Predefined backgrounds
        backgroundImage.src = 'images/backgrounds/' + customBackground + '.jpg';
        currentImage.src = 'images/backgrounds/' + customBackground + '.jpg';
        currentImageSelector.classList.add("background-active");
    }
    else {
        // Custom image
        backgroundImage.src = `file://${customBackground}`;
        currentImage.src = `file://${customBackground}`;
        document.getElementById("bgC").classList.add("background-active");
    }
});


function uploadImage() {
    ipcRenderer.send('open-file-dialog');

    ipcRenderer.on('file-dialog-closed', (event, filePath) => {
        console.log('Selected image path:', filePath);

        localStorage.setItem('customBackground', filePath);
        document.getElementById('current-image').src = `file://${filePath}`;
        document.getElementById("bgC").classList.add("background-active");
        setTimeout(function () {
            location.reload();
        }, 1000);
    });
}

function changeBackground(backgroundIndex) {
    let backgroundImage = document.getElementById('background-image');
    let currentImage = document.getElementById('current-image');

    let activeElements = document.getElementsByClassName("background-active");
    Array.from(activeElements).forEach(element => {
        element.classList.remove("background-active");
    });

    if (backgroundIndex === 0) {
        // Default background
        backgroundImage.src = 'images/backgrounds/bg.jpg';
        currentImage.src = 'images/backgrounds/bg.jpg';
        localStorage.setItem('customBackground', 0);
    } else if (backgroundIndex > 0 && backgroundIndex < 11) {
        // Predefined backgrounds
        backgroundImage.src = `images/backgrounds/${backgroundIndex}.jpg`;
        currentImage.src = `images/backgrounds/${backgroundIndex}.jpg`;
        localStorage.setItem('customBackground', backgroundIndex);
        // Add the "background-active" class to the selected element
        document.getElementById("bg" + backgroundIndex).classList.add("background-active");
    }
}

