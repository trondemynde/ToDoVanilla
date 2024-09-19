const tasks = [];
let lastTaskId = 0;

let taskList;
let addTask;

const AUTH_TOKEN = 'Ze5VLQ-r2C1KXVrhiJqd7YrgZJF5MTnC';

window.addEventListener('load', async () => {
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');

    // Fetch existing tasks from the server and render them
    const fetchedTasks = await getTasksFromServer();
    fetchedTasks.forEach((task) => {
        tasks.push(task);
        renderTask(task);
    });

    // When the button is clicked, add a new task
    addTask.addEventListener('click', async () => {
        const task = await createTaskOnServer(); // Create a new task on the server and locally
        const taskRow = createTaskRow(task); // Create an HTML row for the new task
        taskList.appendChild(taskRow); // Add the task row to the page
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
        title: 'Task ' + lastTaskId, // Changed from 'name' to 'title'
        description: 'Description for task ' + lastTaskId, // Added description
        completed: false
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

async function updateTaskOnServer(task) {
    try {
        const response = await fetch(`https://demo2.z-bit.ee/tasks/${task.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error updating task on server:', errorData);
            throw new Error(`Failed to update task on server: ${response.statusText}`);
        }

        const updatedTask = await response.json();
        console.log('Updated Task:', updatedTask);
        // Update local task array if needed
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

function createTaskRow(task) {
    let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
    taskRow.removeAttribute('data-template');

    // Fill in the form fields with task data
    const titleInput = taskRow.querySelector("[name='title']");
    if (titleInput) {
        titleInput.value = task.title;
    } else {
        console.error("Title input not found");
    }

    const descriptionInput = taskRow.querySelector("[name='description']");
    if (descriptionInput) {
        descriptionInput.value = task.description;
    } else {
        console.error("Description input not found");
    }

    const checkbox = taskRow.querySelector("[name='completed']");
    if (checkbox) {
        checkbox.checked = task.completed;

        // Add an event listener for checkbox change
        checkbox.addEventListener('change', async () => {
            task.completed = checkbox.checked;
            await updateTaskOnServer(task);
        });
    } else {
        console.error("Completed checkbox not found");
    }

    const deleteButton = taskRow.querySelector('.delete-task');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            await deleteTaskOnServer(task.id);
            taskList.removeChild(taskRow);
            tasks.splice(tasks.indexOf(task), 1);
        });
    } else {
        console.error("Delete button not found");
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
        if (wrapper.__hydrated)
            continue;
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
