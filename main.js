const tasks = [];
let lastTaskId = 0;

let taskList;
let addTask;
let updateTask;

const AUTH_TOKEN = 'Ze5VLQ-r2C1KXVrhiJqd7YrgZJF5MTnC';

// Initialize on window load
window.addEventListener('load', async () => {
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');
    updateTask = document.querySelector('#update-task'); // Combine initialization

    // Fetch existing tasks from the server and render them
    const fetchedTasks = await getTasksFromServer();
    fetchedTasks.forEach((task) => {
        tasks.push(task);
        renderTask(task);
    });

    // Add task when the button is clicked
    addTask.addEventListener('click', async () => {
        const task = await createTaskOnServer();
        if (task) {
            const taskRow = createTaskRow(task);
            taskList.appendChild(taskRow);
        }
    });

    // Update all tasks when the update button is clicked
    updateTask.addEventListener('click', async () => {
        await updateAllTasksOnServer();
    });
});

// Fetch all tasks from the server (GET request)
async function getTasksFromServer() {
    try {
        const response = await fetch('https://demo2.z-bit.ee/tasks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return await response.json();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

// Create a task both locally and on the server (POST request)
async function createTaskOnServer() {
    lastTaskId++;

    const task = {
        title: 'Task ' + lastTaskId,
        desc: 'Description for task ' + lastTaskId,
        marked_as_done: false
    };

    try {
        const response = await fetch('https://demo2.z-bit.ee/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating task on server:', errorData);
            throw new Error(`Failed to create task on server: ${response.statusText}`);
        }

        const createdTask = await response.json();
        console.log('Created Task:', createdTask);
        tasks.push(createdTask);
        return createdTask;
    } catch (error) {
        console.error('Error creating task on server:', error);
        return null;
    }
}

async function updateAllTasksOnServer() {
    for (const task of tasks) {
        await updateTaskOnServer(task); // Update each task individually
    }
}

// Update task on the server (PUT request)
async function updateTaskOnServer(task) {
    if (!task || !task.id) {
        console.error('Task is undefined or missing ID:', task);
        return;
    }


    // Fetch the latest values from the input fields for the current task row
    const taskRow = document.querySelector(`[data-task-id="${task.id}"]`);
    if (taskRow) {
        task.title = taskRow.querySelector("[name='title']").value;
        task.desc = taskRow.querySelector("[name='description']").value;
        task.marked_as_done = taskRow.querySelector("[name='completed']").checked;
    }


    try {
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

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error updating task on server:', errorData);
            throw new Error(`Failed to update task on server: ${response.statusText}`);
        }

        const updatedTask = await response.json();
        console.log('Updated Task:', updatedTask);

        // Update local task array
        const index = tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
        }
    } catch (error) {
        console.error('Error updating task on server:', error);
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
    taskRow.setAttribute('data-task-id', task.id); // Set a data attribute for easy selection

    const titleInput = taskRow.querySelector("[name='title']");
    if (titleInput) {
        titleInput.value = task.title;
    }

    const descriptionInput = taskRow.querySelector("[name='description']");
    if (descriptionInput) {
        descriptionInput.value = task.desc || '';
    }

    const checkbox = taskRow.querySelector("[name='completed']");
    if (checkbox) {
        checkbox.checked = task.marked_as_done;
        checkbox.removeEventListener('change', handleCheckboxChange);
        checkbox.addEventListener('change', handleCheckboxChange);
    }

    // Event handler function
    function handleCheckboxChange() {
        task.marked_as_done = checkbox.checked;
        console.log('Checkbox changed:', task);
    }

    const deleteButton = taskRow.querySelector('.delete-task');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            await deleteTaskOnServer(task.id);
            taskList.removeChild(taskRow);
            tasks.splice(tasks.indexOf(task), 1);
        });
    } else {
        console.error('Delete button not found');
    }

    hydrateAntCheckboxes(taskRow);

    return taskRow;
}

// Delete a task from the server (DELETE request)
async function deleteTaskOnServer(taskId) {
    try {
        const response = await fetch(`https://demo2.z-bit.ee/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete task');
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function createAntCheckbox() {
    const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
    checkbox.removeAttribute('data-template');
    hydrateAntCheckboxes(checkbox);
    return checkbox;
}

function hydrateAntCheckboxes(element) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper');
    for (let i = 0; i < elements.length; i++) {
        let wrapper = elements[i];

        // Skip if already processed
        if (wrapper.__hydrated) continue;
        wrapper.__hydrated = true;

        const checkbox = wrapper.querySelector('.ant-checkbox');

        // Check if checkbox should be initially checked
        const input = wrapper.querySelector('.ant-checkbox-input');
        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked');
        }

        // Update checkbox appearance on input change
        input.addEventListener('change', () => {
            checkbox.classList.toggle('ant-checkbox-checked');
        });
    }
}
