<template>
  <v-app>
    <!-- Top Banner with title and Add button -->
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>
        <v-icon class="me-2">mdi-layers</v-icon>  <!-- Icon in title -->
        FRAMEWORKS
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- Add Task button with plus icon -->
      <v-btn color="secondary" @click="openAddDialog">
        <v-icon left>mdi-plus</v-icon>
        Add
      </v-btn>
    </v-app-bar>

    <!-- Main content: Tasks table -->
    <v-main class="pa-4">
      <v-table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Description</th>
            <th>Deadline</th>
            <th>Priority</th>
            <th class="text-center">Is Complete</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(task, index) in tasks" :key="task.title">
            <td>{{ task.title }}</td>
            <td>{{ task.description }}</td>
            <td>{{ formatDate(task.deadline) }}</td>
            <td style="text-transform: capitalize;">{{ task.priority }}</td>
            <td class="text-center">
              <v-checkbox v-model="task.completed" :true-value="true" :false-value="false" />
            </td>
            <td>
              <!-- Update (Edit) button is disabled if task is complete -->
              <v-btn size="small" variant="outlined" color="primary"
                    :disabled="task.completed"
                    @click="openEditDialog(task, index)">
                <v-icon left>mdi-pencil</v-icon>
                Update
              </v-btn>
              <!-- Delete button -->
              <v-btn size="small" variant="outlined" color="error"
                    @click="deleteTask(index)">
                <v-icon left>mdi-delete</v-icon>
                Delete
              </v-btn>
            </td>
          </tr>
          <!-- Message for empty list -->
          <tr v-if="tasks.length === 0">
            <td colspan="6" class="text-center">No tasks added yet.</td>
          </tr>
        </tbody>
      </v-table>
    </v-main>

    <!-- Reusable Dialog Component for Adding/Editing Tasks -->
    <TaskDialog v-model="showDialog"
                :isEdit="editMode"
                :task="selectedTask"
                :tasks="tasks"
                @add-task="addTask"
                @update-task="updateTask" />

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.visible" location="bottom right" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import TaskDialog from './components/TaskDialog.vue';

const tasks = ref([]);               // Task list (array of task objects)
const showDialog = ref(false);       // Controls TaskDialog visibility
const editMode = ref(false);         // True if editing an existing task
const selectedTask = ref({});        // The task data currently being added/edited
const selectedIndex = ref(null);     // Index of the task being edited (if any)

const snackbar = ref({               // Snackbar state for notifications
  visible: false,
  message: ''
});

// Utility: format a Date to MM/DD/YYYY string
function formatDate(date) {
  return date ? date.toLocaleDateString('en-US') : '';
}

// Open the dialog to add a new task
function openAddDialog() {
  selectedTask.value = {
    title: '',
    description: '',
    deadline: null,
    priority: 'low',
    completed: false
  };
  editMode.value = false;
  showDialog.value = true;
}

// Open the dialog to edit an existing task
function openEditDialog(task, index) {
  // Make a shallow copy of the task to avoid mutating the original until saved
  selectedTask.value = { ...task };
  if (task.deadline) {
    // Clone the date object if a deadline exists
    selectedTask.value.deadline = new Date(task.deadline);
  }
  editMode.value = true;
  selectedIndex.value = index;
  showDialog.value = true;
}

// Handle adding a new task (called when TaskDialog emits 'add-task')
function addTask(newTask) {
  tasks.value.push(newTask);
  showNotification('Task added successfully');
}

// Handle updating an existing task (called when TaskDialog emits 'update-task')
function updateTask(updatedTask) {
  if (selectedIndex.value !== null) {
    tasks.value[selectedIndex.value] = updatedTask;
    showNotification('Task updated successfully');
  }
}

// Remove a task from the list
function deleteTask(index) {
  tasks.value.splice(index, 1);
  showNotification('Task deleted successfully');
}

// Show a snackbar notification with a message
function showNotification(message) {
  snackbar.value.message = message;
  snackbar.value.visible = true;
}
</script>
