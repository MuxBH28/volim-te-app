const textArray = [
    '🇬🇧 I Love You',
    '🇫🇷 Je t\'aime',
    '🇪🇸 Te quiero',
    '🇩🇪 Ich liebe dich',
    '🇮🇹 Ti amo',
    '🇧🇦 Volim te',
    '🇵🇹 Eu te amo',
    'أحبك 🇦🇪',
    '🇷🇺 Я тебя люблю',
    '🇹🇷 Seni seviyorum',
];

function updateText() {
    const ILoveYouElement = document.getElementById('ILoveYou');
    const randomIndex = Math.floor(Math.random() * textArray.length);

    ILoveYouElement.style.opacity = 0;

    setTimeout(() => {
        ILoveYouElement.innerHTML = textArray[randomIndex];
        ILoveYouElement.style.opacity = 1;
    }, 500);
}

setInterval(updateText, 5000);