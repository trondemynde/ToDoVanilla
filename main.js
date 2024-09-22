const tasks = [];
let lastTaskId = 0;

let taskList;
let addTask;
let updateTask;

const AUTH_TOKEN = localStorage.getItem('access_token');

// Initialize on window load
window.addEventListener('load', async () => {
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');
    updateTask = document.querySelector('#update-task'); 

    const fetchedTasks = await getTasksFromServer();
    fetchedTasks.forEach((task) => {
        tasks.push(task);
        renderTask(task);
    });

    addTask.addEventListener('click', async () => {
        const task = await createTaskOnServer();
        if (task) {
            const taskRow = createTaskRow(task);
            taskList.appendChild(taskRow);
        }
    });

    updateTask.addEventListener('click', async () => {
        await updateAllTasksOnServer();
    });
});

// Fetch all tasks from the server
async function getTasksFromServer() {
    const response = await fetch('https://demo2.z-bit.ee/tasks', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });
    return response.ok ? await response.json() : [];
}

// Create a task local and server
async function createTaskOnServer() {
    lastTaskId++;

    const task = {
        title: 'Task ' + lastTaskId,
        desc: 'Description for task ' + lastTaskId,
        marked_as_done: false
    };

    const response = await fetch('https://demo2.z-bit.ee/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(task)
    });

    if (!response.ok) return null;

    const createdTask = await response.json();
    tasks.push(createdTask);
    return createdTask;
}

async function updateAllTasksOnServer() {
    for (const task of tasks) {
        await updateTaskOnServer(task);
    }
}

// Update tasks
async function updateTaskOnServer(task) {
    if (!task || !task.id) return;

    const taskRow = document.querySelector(`[data-task-id="${task.id}"]`);
    if (taskRow) {
        task.title = taskRow.querySelector("[name='title']").value;
        task.desc = taskRow.querySelector("[name='description']").value;
        task.marked_as_done = taskRow.querySelector("[name='completed']").checked;
    }

    const response = await fetch(`https://demo2.z-bit.ee/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
            title: task.title,
            desc: task.desc,
            marked_as_done: task.marked_as_done
        })
    });

    if (response.ok) {
        const updatedTask = await response.json();
        const index = tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
        }
    }
}

function renderTask(task) {
    const taskRow = createTaskRow(task);
    taskList.appendChild(taskRow);
}

// Modify the createTaskRow function to set data-task-id for each task row
function createTaskRow(task) {
    let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
    taskRow.removeAttribute('data-template');
    taskRow.setAttribute('data-task-id', task.id); 

    const titleInput = taskRow.querySelector("[name='title']");
    if (titleInput) titleInput.value = task.title;

    const descriptionInput = taskRow.querySelector("[name='description']");
    if (descriptionInput) descriptionInput.value = task.desc || '';

    const checkbox = taskRow.querySelector("[name='completed']");
    if (checkbox) {
        checkbox.checked = task.marked_as_done;
        checkbox.addEventListener('change', handleCheckboxChange);
    }

    function handleCheckboxChange() {
        task.marked_as_done = checkbox.checked;
    }

    const deleteButton = taskRow.querySelector('.delete-task');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            await deleteTaskOnServer(task.id);
            taskList.removeChild(taskRow);
            tasks.splice(tasks.indexOf(task), 1);
        });
    }

    hydrateAntCheckboxes(taskRow);
    return taskRow;
}

// Delete a task from the server (DELETE request)
async function deleteTaskOnServer(taskId) {
    await fetch(`https://demo2.z-bit.ee/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });
}

function createAntCheckbox() {
    const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
    checkbox.removeAttribute('data-template');
    hydrateAntCheckboxes(checkbox);
    return checkbox;
}

function hydrateAntCheckboxes(element) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper');
    for (let wrapper of elements) {
        if (wrapper.__hydrated) continue;
        wrapper.__hydrated = true;

        const checkbox = wrapper.querySelector('.ant-checkbox');
        const input = wrapper.querySelector('.ant-checkbox-input');
        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked');
        }

        input.addEventListener('change', () => {
            checkbox.classList.toggle('ant-checkbox-checked');
        });
    }
}
