const API_URL = "https://67e7b45120e3af747c3f4bce.mockapi.io/tasks";
let allTasks = [];
let currentEditingTask = null;

async function initialize() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allTasks = data.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority ? task.priority.toLowerCase() : 'medium',
            status: task.status || 'To do'
        }));
        renderBoard();
    } catch (error) {
        console.error('Error:', error);
        alert('Server error');
    }
}

function renderBoard(filteredTasks = allTasks) {
    const board = document.getElementById('task-board');
    board.innerHTML = '';
    ['To do', 'In progress', 'Closed', 'Frozen'].forEach(status => {
        const column = document.createElement('div');
        column.className = 'column';
        column.innerHTML = `<h2>${status}</h2>`;
        filteredTasks
            .filter(task => task.status === status)
            .forEach(task => column.appendChild(createTaskElement(task)));
        board.appendChild(column);
    });
}

function createTaskElement(task) {
    const element = document.createElement('div');
    element.className = 'task';
    element.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="date">Due: ${formatDate(task.dueDate)}</div>
        <div class="priority-tag priority-${task.priority}">${task.priority}</div>
        <div class="buttons">
            <button class="delete-btn" onclick="deleteTask('${task.id}')">Delete</button>
            <button class="edit-btn" onclick="openEditModal('${task.id}')">Edit</button>
            ${['To do', 'In progress', 'Closed', 'Frozen']
                .filter(s => s !== task.status)
                .map(s => `<button class="move-btn" onclick="moveTask('${task.id}', '${s}')">Move to ${s}</button>`)
                .join('')}
        </div>
    `;
    return element;
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
}

async function addNewTask() {
    const newTask = {
        title: document.getElementById('new-title').value,
        description: document.getElementById('new-description').value,
        dueDate: document.getElementById('new-due-date').value,
        priority: document.getElementById('new-priority').value,
        status: 'To do'
    };

    if (!newTask.title || !newTask.dueDate) {
        alert('Title and Due Date are required!');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newTask)
        });
        const createdTask = await response.json();
        allTasks.push({
            ...createdTask,
            dueDate: newTask.dueDate,
            priority: newTask.priority.toLowerCase()
        });
        renderBoard();
        toggleAddForm();
        clearAddForm();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task');
    }
}

function openEditModal(taskId) {
    currentEditingTask = allTasks.find(t => t.id === taskId);
    if (!currentEditingTask) {
        alert('Task not found!');
        return;
    }
    
    document.getElementById('edit-title').value = currentEditingTask.title;
    document.getElementById('edit-description').value = currentEditingTask.description || '';
    const dueDate = currentEditingTask.dueDate ? 
        new Date(currentEditingTask.dueDate).toISOString().split('T')[0] : 
        '';
    document.getElementById('edit-due-date').value = dueDate;
    document.getElementById('edit-priority').value = currentEditingTask.priority;
    document.getElementById('edit-status').value = currentEditingTask.status;
    document.getElementById('edit-modal').style.display = 'flex';
}

async function saveEditedTask() {
    if (!currentEditingTask) return;

    const updatedTask = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        dueDate: document.getElementById('edit-due-date').value,
        priority: document.getElementById('edit-priority').value,
        status: document.getElementById('edit-status').value
    };

    if (!updatedTask.title || !updatedTask.dueDate) {
        alert('Title and Due Date are required!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${currentEditingTask.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedTask)
        });
        
        if (!response.ok) throw new Error('Failed to update task');

        Object.assign(currentEditingTask, {
            ...updatedTask,
            priority: updatedTask.priority.toLowerCase()
        });
        
        renderBoard();
        closeEditModal();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditingTask = null;
}

async function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await fetch(`${API_URL}/${taskId}`, {method: 'DELETE'});
            allTasks = allTasks.filter(t => t.id !== taskId);
            renderBoard();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    }
}

async function moveTask(taskId, newStatus) {
    try {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) throw new Error('Task not found');

        await fetch(`${API_URL}/${taskId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: newStatus})
        });
        
        task.status = newStatus;
        renderBoard();
    } catch (error) {
        console.error('Error moving task:', error);
        alert('Failed to move task');
    }
}

function searchTasks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const priorityFilter = document.getElementById('priority-filter').value;
    
    const filtered = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter ? 
            task.priority === priorityFilter : true;
        return matchesSearch && matchesPriority;
    });
    
    renderBoard(filtered);
}

function toggleAddForm() {
    const modal = document.getElementById('add-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    clearAddForm();
}

function clearAddForm() {
    document.getElementById('new-title').value = '';
    document.getElementById('new-description').value = '';
    document.getElementById('new-due-date').value = '';
    document.getElementById('new-priority').value = 'high';
}

document.addEventListener('DOMContentLoaded', initialize);