document.addEventListener('DOMContentLoaded', function () {
    function fetchMilestones() {
        ipcRenderer.send('fetch-milestones');

        ipcRenderer.once('milestones-fetched', (event, milestones) => {
            const milestonesContainer = document.getElementById('milestonesContainer');
            let nomilestonesSpan = document.getElementById('noMilestonesSpan');
            milestonesContainer.innerHTML = '';

            if (milestones.length === 0) {
                nomilestonesSpan.style.display = 'block';
            } else {
                milestones.forEach(milestone => {
                    const milestoneElement = createMilestoneElement(milestone);
                    milestonesContainer.appendChild(milestoneElement);
                });
                nomilestonesSpan.style.display = 'none';
            }
        });
    }

    function createMilestoneElement(milestone) {
        const milestoneElement = document.createElement('div');
        milestoneElement.classList.add('milestone');
        milestoneElement.id = `milestone-${milestone._id}`;
    
        const dateElement = document.createElement('p');
        dateElement.classList.add('milestone-date');
        dateElement.textContent = milestone.date;
    
        const titleElement = document.createElement('p');
        titleElement.classList.add('milestone-title');
        titleElement.textContent = milestone.title;
    
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container-milestone');
    
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        deleteButton.addEventListener('click', () => deleteMilestone(milestone._id));
    
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyButton.addEventListener('click', () => copyMilestone(milestone._id));
    
        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(copyButton);
    
        milestoneElement.appendChild(dateElement);
        milestoneElement.appendChild(titleElement);
        milestoneElement.appendChild(buttonContainer);
    
        return milestoneElement;
    }
    

    fetchMilestones();

    window.saveMilestone = function () {
        const inputMilestoneNameElement = document.getElementById('inputMilestoneName');
        let saveMilestoneButton = document.getElementById('saveMilestoneButton');
        let inputMilestoneDate = document.getElementById('inputMilestoneDate');

        ipcRenderer.send('save-milestone', {
            title: inputMilestoneNameElement.value,
            date: inputMilestoneDate.value,
        });

        saveMilestoneButton.innerHTML = 'Saved';

        setTimeout(() => {
            saveMilestoneButton.innerHTML = 'Save';
            inputMilestoneNameElement.value = '';
            inputMilestoneDate.value = '';
        }, 2000);

        fetchMilestones();
        updateStatistics();
    };

    function deleteMilestone(milestoneId) {
        ipcRenderer.send('delete-milestone', milestoneId);
        fetchMilestones();
    }

    function copyMilestone(milestoneId) {
        const copyButton = document.getElementById(`milestone-${milestoneId}`).getElementsByClassName("copy-button")[0];

        const milestoneElement = document.getElementById(`milestone-${milestoneId}`);

        const title = milestoneElement.querySelector('h3').textContent;
        const content = milestoneElement.querySelector('p').textContent;
        const date = milestoneElement.querySelector('.milestone-date').textContent;

        const copiedText = `Volim Te App Milestone\nMilestone name: \n${content}\nDate: ${date}`;

        const textarea = document.createElement('textarea');
        textarea.value = copiedText;
        document.body.appendChild(textarea);

        textarea.select();
        document.execCommand('copy');

        document.body.removeChild(textarea);

        copyButton.innerHTML = '<i class="fa-solid fa-copy"></i>';
        setTimeout(() => {
            copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 1000);
    }


    ipcRenderer.on('milestone-deleted', (event, milestoneId) => {
        const milestonesContainer = document.getElementById('milestonesContainer');
        const deletedMilestoneElement = document.getElementById(`milestone-${milestoneId}`);

        if (deletedMilestoneElement) {
            milestonesContainer.removeChild(deletedMilestoneElement);
        }
    });
});
