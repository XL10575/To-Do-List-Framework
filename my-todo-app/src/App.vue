<template>
  <v-app>
    <!-- Top App Bar -->
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

    <!-- Main Content: Task Table -->
    <v-main class="pa-4">
      <v-container>
        <v-simple-table class="task-table">
          <thead>
            <tr>
              <th style="width: 20%;">Task</th>
              <th style="width: 30%;">Description</th>
              <th style="width: 15%;">Deadline</th>
              <th style="width: 15%;">Priority</th>
              <th style="width: 10%;" class="text-center">Is Complete</th>
              <th style="width: 10%;">Action</th>
            </tr>
          </thead>
          <tbody>
            <!-- Always show header row. If no tasks, show a message row -->
            <tr v-if="tasks.length === 0">
              <td colspan="6" class="text-center">No tasks added yet.</td>
            </tr>
            <tr v-for="(task, index) in tasks" :key="task.title">
              <td>{{ task.title }}</td>
              <td>{{ task.description }}</td>
              <td>{{ formatDate(task.deadline) }}</td>
              <td style="text-transform: capitalize;">{{ task.priority }}</td>
              <td class="text-center">
                <v-checkbox
                  v-model="task.completed"
                  :true-value="true"
                  :false-value="false"
                  hide-details
                ></v-checkbox>
              </td>
              <td>
                <!-- Update button hides if task is marked complete -->
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
          </tbody>
        </v-simple-table>
      </v-container>
    </v-main>

    <!-- Dialog: Add / Update Task -->
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editMode ? 'Update Task' : 'Add Task' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" class="pt-2">
            <!-- Title Field (disabled in edit mode) -->
            <v-text-field
              label="Task"
              v-model="selectedTask.title"
              :disabled="editMode"
              :rules="titleRules"
              required
            ></v-text-field>
            <!-- Description Field -->
            <v-text-field
              label="Description"
              v-model="selectedTask.description"
              :rules="[v => !!v || 'Description is required']"
              required
              class="mt-3"
            ></v-text-field>
            <!-- Deadline Field: date picker only -->
            <v-text-field
              label="Deadline"
              v-model="selectedTask.deadline"
              type="date"
              required
              class="mt-3"
            ></v-text-field>
            <!-- Priority Field: radio group -->
            <v-radio-group
              v-model="selectedTask.priority"
              label="Priority"
              row
              class="mt-3"
            >
              <v-radio label="Low" value="low"></v-radio>
              <v-radio label="Medium" value="medium"></v-radio>
              <v-radio label="High" value="high"></v-radio>
            </v-radio-group>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveTask">
            {{ editMode ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for Notifications -->
    <v-snackbar v-model="snackbar.visible" location="bottom right" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// Reference for form validation (if needed)
const formRef = ref(null);

// Array that holds all tasks
const tasks = ref([]);

// Controls for dialog and current task
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

// Snackbar notification state
const snackbar = ref({
  visible: false,
  message: ''
});

// Validation rules for the Title field. In add mode, title must be unique.
const titleRules = computed(() => [
  v => !!v || 'Task title is required',
  v => {
    if (editMode.value) return true; // in edit mode the title is locked, so skip uniqueness
    const tl = v ? v.toLowerCase() : '';
    return tasks.value.every(task => task.title.toLowerCase() !== tl) || 'Title already exists';
  }
]);

// Formats a Date object (or date string) to MM/DD/YYYY for display in the table.
function formatDate(date) {
  if (!date) return '';
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US');
}

// Helper: Format a date to YYYY-MM-DD for the date input (if needed)
function formatDateForInput(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d)) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Opens the dialog in Add mode by clearing the selectedTask fields.
function openAddDialog() {
  editMode.value = false;
  selectedTask.title = '';
  selectedTask.description = '';
  selectedTask.deadline = '';
  selectedTask.priority = 'low';
  selectedTask.completed = false;
  selectedIndex.value = null;
  if (formRef.value) {
    formRef.value.resetValidation();
  }
  showDialog.value = true;
}

// Opens the dialog in Edit mode, populating the selectedTask fields.
function openEditDialog(task, index) {
  editMode.value = true;
  selectedIndex.value = index;
  selectedTask.title = task.title;
  selectedTask.description = task.description;
  // Ensure the deadline is in YYYY-MM-DD format for date input.
  selectedTask.deadline = task.deadline ? formatDateForInput(task.deadline) : '';
  selectedTask.priority = task.priority;
  selectedTask.completed = task.completed;
  if (formRef.value) {
    formRef.value.resetValidation();
  }
  showDialog.value = true;
}

// Closes the dialog without saving changes.
function closeDialog() {
  showDialog.value = false;
}

// Saves the task data from the dialog. It adds a new task or updates an existing one.
async function saveTask() {
  if (!selectedTask.title || !selectedTask.description || !selectedTask.deadline) {
    showNotification("Please complete all required fields.");
    return;
  }
  const deadlineDate = selectedTask.deadline ? new Date(selectedTask.deadline) : null;
  if (deadlineDate && isNaN(deadlineDate)) {
    showNotification("Invalid deadline date.");
    return;
  }
  const taskData = {
    title: selectedTask.title,
    description: selectedTask.description,
    deadline: deadlineDate,
    priority: selectedTask.priority,
    completed: selectedTask.completed
  };
  if (editMode.value && selectedIndex.value !== null) {
    tasks.value[selectedIndex.value] = taskData;
    showNotification("Task updated successfully.");
  } else {
    tasks.value.push(taskData);
    showNotification("Task added successfully.");
  }
  showDialog.value = false;
}

// Deletes the task at the specified index.
function deleteTask(index) {
  tasks.value.splice(index, 1);
  showNotification("Task deleted successfully.");
}

// Displays a notification message in the snackbar.
function showNotification(message) {
  snackbar.value.message = message;
  snackbar.value.visible = true;
}
</script>

<style scoped>
/* Table styling: evenly spaced columns and aligned content */
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
