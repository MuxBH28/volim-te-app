document.addEventListener('DOMContentLoaded', function () {
    function fetchMemories() {
        ipcRenderer.send('fetch-memories');

        ipcRenderer.once('memories-fetched', (event, memories) => {
            const memoriesContainer = document.getElementById('memoriesContainer');
            let noMemoriesSpan = document.getElementById('noMemoriesSpan');
            memoriesContainer.innerHTML = '';

            if (memories.length === 0) {
                noMemoriesSpan.style.display = 'block';
            } else {
                memories.forEach(memory => {
                    const memoryElement = createMemoryElement(memory);
                    memoriesContainer.appendChild(memoryElement);
                });
                noMemoriesSpan.style.display = 'none';
            }
        });
    }

    function createMemoryElement(memory) {
        const memoryElement = document.createElement('div');
        memoryElement.classList.add('memory');
        memoryElement.id = `memory-${memory._id}`;

        const titleElement = document.createElement('h3');
        titleElement.textContent = memory.title;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        deleteButton.addEventListener('click', () => deleteMemory(memory._id));

        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyButton.addEventListener('click', () => copyMemory(memory._id));

        const contentElement = document.createElement('p');
        contentElement.textContent = memory.content;

        const dateElement = document.createElement('span');
        dateElement.classList.add('memory-date');
        dateElement.textContent = memory.date;

        memoryElement.appendChild(titleElement);
        memoryElement.appendChild(deleteButton);
        memoryElement.appendChild(copyButton);
        memoryElement.appendChild(contentElement);
        memoryElement.appendChild(dateElement);

        return memoryElement;
    }

    fetchMemories();

    window.saveMemory = function () {
        const inputMemoryNameElement = document.getElementById('inputMemoryName');
        const inputMemoryTextAreaElement = document.getElementById('inputMemoryTextArea');
        const currentDate = new Date().toLocaleDateString('en-GB');
        let saveMemoryButton = document.getElementById('saveMemoryButton');

        ipcRenderer.send('save-memory', {
            title: inputMemoryNameElement.value,
            content: inputMemoryTextAreaElement.value,
            date: currentDate,
        });

        saveMemoryButton.innerHTML = 'Saved';

        setTimeout(() => {
            saveMemoryButton.innerHTML = 'Save';
            inputMemoryNameElement.value = '';
            inputMemoryTextAreaElement.value = '';
        }, 2000);

        fetchMemories();
        updateStatistics();
    };

    function deleteMemory(memoryId) {
        ipcRenderer.send('delete-memory', memoryId);
        fetchMemories();
    }

    function copyMemory(memoryId) {
        const copyButton = document.getElementById(`memory-${memoryId}`).getElementsByClassName("copy-button")[0];

        const memoryElement = document.getElementById(`memory-${memoryId}`);

        const title = memoryElement.querySelector('h3').textContent;
        const content = memoryElement.querySelector('p').textContent;
        const date = memoryElement.querySelector('.memory-date').textContent;

        const copiedText = `Volim Te App Memory\nTitle: ${title}\nMemory: \n${content}\nDate: ${date}`;

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


    ipcRenderer.on('memory-deleted', (event, memoryId) => {
        const memoriesContainer = document.getElementById('memoriesContainer');
        const deletedMemoryElement = document.getElementById(`memory-${memoryId}`);

        if (deletedMemoryElement) {
            memoriesContainer.removeChild(deletedMemoryElement);
        }
    });
});
