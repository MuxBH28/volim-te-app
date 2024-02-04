const axios = require('axios');

document.addEventListener('DOMContentLoaded', async function () {
    const npointEndpoint = '[REDACTED]';

    try {
        let storedTotalNewsCount = localStorage.getItem('totalNewsCount') || 0;
        let userClickedNewsIcon = localStorage.getItem('userClickedNewsIcon');

        const response = await axios.get(npointEndpoint);
        const preferences = response.data[0].Preferences || {};
        const newsData = response.data.slice(1);

        const newsContainer = document.getElementById('news-container');
        const newsIcon = document.querySelector('.fa-bullhorn');

        let currentTotalNewsCount = parseInt(preferences.News, 10) || 0;

        let oldTotalNewsCount = storedTotalNewsCount;

        if (currentTotalNewsCount !== storedTotalNewsCount) {
            storedTotalNewsCount = currentTotalNewsCount;
        }

        let latestNewsTimestamp = storedTotalNewsCount;

        if (newsData.length > 0 && preferences.Show === 'True') {
            newsData.forEach((item, index) => {
                const newsItem = document.createElement('div');
                newsItem.classList.add('news-single');

                newsItem.innerHTML = `
                    <h3>📣 ${item.Title}</h3>
                    <p>💬 ${item.Message}</p>
                    <a href="${item.Link}" target="_blank">${item.Button}</a>
                    <p>📅 ${item.Date}</p>
                `;

                newsContainer.appendChild(newsItem);

                if (index + 1 > latestNewsTimestamp) {
                    latestNewsTimestamp = index + 1;
                }

                if (item.Type === 'Update' && preferences.Version != versionNumber) {
                    const desktopNotificationUpdate = new Notification('Volim Te App ' + versionNumber, {
                        body: `New update is available!\nNew version: ${preferences.Version}\nClick here to download it.`,
                        icon: '../images/icon-installer.ico',
                        requireInteraction: true,
                    });
                    desktopNotificationUpdate.addEventListener('click', () => {
                        window.open(item.Link, '_blank');
                    });
                }
            });
        }

        if (latestNewsTimestamp > 0 && (!userClickedNewsIcon || latestNewsTimestamp > oldTotalNewsCount)) {
            newsIcon.classList.add('fa-beat');
            newsIcon.style.color = 'red';
            const desktopNotification = new Notification('Volim Te App', {
                body: `New announcements are published!\nClick here to see them.`,
                icon: '../images/icon.png',
                requireInteraction: true,
            });
            desktopNotification.addEventListener('click', () => {
                showTab('news');
            });
        } else {
            newsIcon.classList.remove('fa-beat');
            newsIcon.style.color = '';
        }

        if (preferences.Show === 'False') {
            newsContainer.innerHTML = `<p>No news available at the moment.</p>
            <p>Please visit <a href="https://sehic.rf.gd/volimte" target="_blank">www.sehic.rf.gd/volimte</a> for more information.`;
        }

        localStorage.setItem('userClickedNewsIcon', 'false');
        localStorage.setItem('totalNewsCount', latestNewsTimestamp);
    } catch (error) {
        console.error('Error fetching and displaying data:', error.message);
    }
});
