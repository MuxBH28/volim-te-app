document.addEventListener('DOMContentLoaded', function () {
    ipcRenderer.send('update-launch-count');
    updateStatistics();
});
function updateStatistics() {
    ipcRenderer.send('request-stats');

    ipcRenderer.on('stats-response', (event, stats) => {
        const dateStatElement = document.getElementById('dateStat');
        dateStatElement.textContent = stats.dateJoined || 'N/A';

        const launchesStatElement = document.getElementById('launchesStat');
        launchesStatElement.textContent = stats.launchCount || '0';

        const cardsStatElement = document.getElementById('cardsStat');
        cardsStatElement.textContent = stats.generatedCards || '0';

        const memoriesStatElement = document.getElementById('memoriesStat');
        memoriesStatElement.textContent = stats.memoriesMade || '0';

        const backgroundsStatElement = document.getElementById('backgroundsStat');
        backgroundsStatElement.textContent = stats.backgroundsStat || '0';
    });
}