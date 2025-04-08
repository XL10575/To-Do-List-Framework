<template>
  <v-app>
    <!-- Top Bar -->
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>
        <v-icon class="me-2">mdi-layers</v-icon>
        FRAMEWORKS
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="secondary" @click="openAddDialog">
        <v-icon left>mdi-plus</v-icon>
        Add
      </v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="main-content">
      <v-container>
        <v-row class="mt-6">
          <v-col cols="12">
            <div class="table-responsive">
              <v-simple-table class="task-table">
                <thead>
  <tr>
    <th style="width: 16.66%;" class="text-center">Task</th>
    <th style="width: 16.66%;" class="text-center">Description</th>
    <th style="width: 16.66%;" class="text-center">Deadline</th>
    <th style="width: 16.66%;" class="text-center">Priority</th>
    <th style="width: 16.66%;" class="text-center">Is Complete</th>
    <th style="width: 16.66%;" class="text-center">Action</th>
  </tr>
</thead>

                <tbody>
                  <tr v-for="(task, index) in tasks" :key="task._id || index">
                    <td class="text-center">{{ task.title }}</td>
                    <td class="text-center">{{ task.description }}</td>
                    <td class="text-center">{{ formatDate(task.deadline) }}</td>
                    <td class="text-center" style="text-transform: capitalize;">
                      {{ task.priority }}
                    </td>
                    <td class="text-center">
                      <v-checkbox
                        v-model="task.completed"
                        :true-value="true"
                        :false-value="false"
                        hide-details
                      />
                    </td>
                    <td class="text-center">
                      <v-btn
                        v-if="!task.completed"
                        size="small"
                        variant="outlined"
                        color="primary"
                        @click="openEditDialog(task, index)"
                      >
                        <v-icon left>mdi-pencil</v-icon>
                        Update
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="error"
                        @click="deleteTask(index)"
                      >
                        <v-icon left>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </td>
                  </tr>
                  <tr v-if="tasks.length === 0">
                    <td colspan="6" class="text-center">No tasks added yet.</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-dialog v-model="showDialog" max-width="600px">
  <v-card>
    <v-card-title>
      {{ editMode ? 'Update Task' : 'Add Task' }}
    </v-card-title>
    <v-card-text>
      <v-form ref="formRef" class="pt-2">
        <v-text-field
          label="Title"
          v-model="selectedTask.title"
          :rules="titleRules"
          required
        />
        <v-text-field
          label="Description"
          v-model="selectedTask.description"
          required
          class="mt-3"
        />
        <v-text-field
          label="Deadline"
          v-model="selectedTask.deadline"
          type="date"
          class="mt-3"
          required
        />
        <v-radio-group
          v-model="selectedTask.priority"
          label="Priority"
          row
          class="mt-3"
        >
          <v-radio label="Low" value="low" />
          <v-radio label="Medium" value="medium" />
          <v-radio label="High" value="high" />
        </v-radio-group>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
      <v-btn color="primary" :loading="saving" @click="saveTask">
        {{ editMode ? 'Update' : 'Add' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<!-- Snackbar for notifications -->
<v-snackbar
  v-model="snackbar.visible"
  location="bottom right"
  timeout="3000"
>
  {{ snackbar.message }}
</v-snackbar>

    <!-- Dialog and Snackbar remain unchanged -->
    <!-- ... keep your dialog and snackbar from before ... -->
  </v-app>
</template>


<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const formRef = ref(null);
const tasks = ref([]);

// Dialog and editing controls
const showDialog = ref(false);
const editMode = ref(false);
const selectedTask = reactive({
  title: '',
  description: '',
  deadline: '',
  priority: 'low',
  completed: false
});
const selectedIndex = ref(null);

// Snackbar for notifications
const snackbar = ref({
  visible: false,
  message: ''
});

// Flag for saving (shows loading spinner on button)
const saving = ref(false);

// On mount, load tasks from the server
onMounted(async () => {
  try {
    const res = await fetch('/api/posts');
    tasks.value = await res.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    showNotification('Failed to load tasks from server.');
  }
});

// Title validation rule
const titleRules = computed(() => [
  v => !!v || 'Title is required',
  v => {
    if (editMode.value) return true;
    const titleLower = v ? v.toLowerCase() : '';
    return tasks.value.every(task => (task.title || '').toLowerCase() !== titleLower)
      || 'Title already exists';
  }
]);

// Format a date to a readable format for display
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d) ? '' : d.toLocaleDateString('en-US');
}

// Format a date for the date input (YYYY-MM-DD)
function formatDateForInput(date) {
  const d = new Date(date);
  if (isNaN(d)) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Open the dialog for adding a new task
function openAddDialog() {
  editMode.value = false;
  selectedTask.title = '';
  selectedTask.description = '';
  selectedTask.deadline = '';
  selectedTask.priority = 'low';
  selectedTask.completed = false;
  selectedIndex.value = null;
  if (formRef.value) formRef.value.resetValidation();
  showDialog.value = true;
}

// Open the dialog for editing an existing task
function openEditDialog(task, index) {
  editMode.value = true;
  selectedIndex.value = index;
  selectedTask.title = task.title;
  selectedTask.description = task.description;
  selectedTask.deadline = formatDateForInput(task.deadline);
  selectedTask.priority = task.priority;
  selectedTask.completed = task.completed;
  if (formRef.value) formRef.value.resetValidation();
  showDialog.value = true;
}

// Close the dialog
function closeDialog() {
  showDialog.value = false;
}

// Save a new task or update an existing task
async function saveTask() {
  if (!selectedTask.title || !selectedTask.description || !selectedTask.deadline) {
    showNotification('Please fill out all required fields.');
    return;
  }

  saving.value = true;

  const taskData = {
    title: selectedTask.title,
    description: selectedTask.description,
    deadline: selectedTask.deadline,
    priority: selectedTask.priority,
    completed: selectedTask.completed
  };

  try {
    // Optional: Post to server
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });

    if (res.ok) {
      const newTask = await res.json();
      tasks.value.push(newTask);
    } else {
      // Fallback to local push if API fails
      tasks.value.push({ ...taskData });
    }

    showNotification(editMode.value ? 'Task updated.' : 'Task added.');
  } catch (err) {
    console.error('Error saving task:', err);
    // Fallback: local add if offline
    tasks.value.push({ ...taskData });
    showNotification('Saved locally.');
  } finally {
    showDialog.value = false;
    saving.value = false;
  }
}


// Delete a task from the server
async function deleteTask(index) {
  const taskToDelete = tasks.value[index];
  if (!taskToDelete._id) {
    tasks.value.splice(index, 1);
    showNotification('Task deleted locally');
    return;
  }
  try {
    await fetch(`/api/posts/${taskToDelete._id}`, { method: 'DELETE' });
    tasks.value.splice(index, 1);
    showNotification('Task deleted successfully');
  } catch (error) {
    console.error('Error deleting task:', error);
    showNotification('Error deleting task on server.');
  }
}

// Display a snackbar notification
function showNotification(message) {
  snackbar.value.message = message;
  snackbar.value.visible = true;
}
</script>


<style scoped>
/* Table styling for even spacing and aligned headers */
.task-table {
  width: 100%;
  table-layout: fixed;
}
.task-table th,
.task-table td {
  padding: 8px;
  text-align: left;
  vertical-align: middle;
}
.task-table th.text-center,
.task-table td.text-center {
  text-align: center;
}
</style>
