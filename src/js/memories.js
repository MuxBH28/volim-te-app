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
        memoryElement.id = `memory-${memory._id}`; // Use _id as the unique identifier

        const titleElement = document.createElement('h3');
        titleElement.textContent = memory.title;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteMemory(memory._id));

        const contentElement = document.createElement('p');
        contentElement.textContent = memory.content;

        const dateElement = document.createElement('span');
        dateElement.classList.add('memory-date');
        dateElement.textContent = memory.date;

        memoryElement.appendChild(titleElement);
        memoryElement.appendChild(deleteButton);
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
    };

    function deleteMemory(memoryId) {
        ipcRenderer.send('delete-memory', memoryId);
        fetchMemories();
    }

    ipcRenderer.on('memory-deleted', (event, memoryId) => {
        const memoriesContainer = document.getElementById('memoriesContainer');
        const deletedMemoryElement = document.getElementById(`memory-${memoryId}`);

        if (deletedMemoryElement) {
            memoriesContainer.removeChild(deletedMemoryElement);
        }
    });
});
