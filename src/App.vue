<template>
  <v-app>
    <!-- Top Bar with title and Add button -->
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
              <th style="width: 25%;">Task</th>
              <th style="width: 25%;">Description</th>
              <th style="width: 15%;">Deadline</th>
              <th style="width: 15%;">Priority</th>
              <th style="width: 10%;" class="text-center">Is Complete</th>
              <th style="width: 10%;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(task, index) in tasks" :key="task._id || index">
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
                />
              </td>
              <td>
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
      </v-container>
    </v-main>

    <!-- Dialog for Adding/Editing Task -->
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editMode ? 'Update Task' : 'Add Task' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" class="pt-2">
            <!-- Title Field: required and unique; locked in edit mode -->
            <v-text-field
              label="Title"
              v-model="selectedTask.title"
              :disabled="editMode"
              :rules="titleRules"
              required
            ></v-text-field>
            <!-- Description Field: required -->
            <v-text-field
              label="Description"
              v-model="selectedTask.description"
              :rules="[v => !!v || 'Description is required']"
              required
              class="mt-3"
            ></v-text-field>
            <!-- Deadline Field -->
            <v-text-field
              label="Deadline"
              v-model="selectedTask.deadline"
              type="date"
              required
              class="mt-3"
            ></v-text-field>
            <!-- Priority Field -->
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
  <v-btn color="primary" :loading="saving" @click="saveTask">
    {{ editMode ? 'Update' : 'Add' }}
  </v-btn>
</v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for Notifications -->
    <v-snackbar
      v-model="snackbar.visible"
      location="bottom right"
      timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const formRef = ref(null)
const tasks = ref([])

// Controls dialog visibility, add/edit mode, and holds data for the selected task
const showDialog = ref(false)
const editMode = ref(false)
const selectedTask = reactive({
  title: '',
  description: '',
  deadline: '',
  priority: 'low',
  completed: false
})
const selectedIndex = ref(null)

// Snackbar notification state
const snackbar = ref({
  visible: false,
  message: ''
})

// Loading flag for saving task
const saving = ref(false)

// Load tasks from server on component mount
onMounted(async () => {
  try {
    const res = await fetch('/api/posts') // calls your GET route
    tasks.value = await res.json()         // store them in our tasks array
  } catch (err) {
    console.error('Error fetching tasks:', err)
    showNotification('Failed to load tasks from server.')
  }
})

// Title validation rules
const titleRules = computed(() => [
  v => !!v || 'Title is required',
  v => {
    if (editMode.value) return true
    const titleLower = v ? v.toLowerCase() : ''
    return tasks.value.every(task => (task.title || '').toLowerCase() !== titleLower)
      || 'Title already exists'
  }
])

// Utility: formats date to a readable format
function formatDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return isNaN(d) ? '' : d.toLocaleDateString('en-US')
}

// Helper: formats date for input (YYYY-MM-DD)
function formatDateForInput(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d)) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function openAddDialog() {
  editMode.value = false
  selectedTask.title = ''
  selectedTask.description = ''
  selectedTask.deadline = ''
  selectedTask.priority = 'low'
  selectedTask.completed = false
  selectedIndex.value = null
  if (formRef.value) formRef.value.resetValidation()
  showDialog.value = true
}

function openEditDialog(task, index) {
  editMode.value = true
  selectedIndex.value = index
  selectedTask.title = task.title
  selectedTask.description = task.description
  selectedTask.deadline = formatDateForInput(task.deadline)
  selectedTask.priority = task.priority
  selectedTask.completed = task.completed
  if (formRef.value) formRef.value.resetValidation()
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

async function saveTask() {
  if (!selectedTask.title || !selectedTask.description) {
    showNotification('Please fill out all required fields.')
    return
  }
  
  saving.value = true
  
  const deadlineDate = selectedTask.deadline ? new Date(selectedTask.deadline) : null
  if (selectedTask.deadline && isNaN(deadlineDate)) {
    showNotification('Invalid deadline date')
    saving.value = false
    return
  }
  
  const taskData = {
    title: selectedTask.title,
    description: selectedTask.description,
    deadline: deadlineDate,
    priority: selectedTask.priority,
    completed: selectedTask.completed
  }
  
  console.log("Saving task data:", taskData)
  
  try {
    const postRes = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
    if (!postRes.ok) {
      throw new Error(`Server responded with ${postRes.status}`)
    }
    showNotification('Task added successfully')
    
    // Refresh the task list from the server
    const res = await fetch('/api/posts')
    tasks.value = await res.json()
  } catch (err) {
    console.error('Error adding task:', err)
    showNotification('Error adding task on server.')
  } finally {
    saving.value = false
    showDialog.value = false
  }
}

async function deleteTask(index) {
  const taskToDelete = tasks.value[index]
  if (!taskToDelete._id) {
    tasks.value.splice(index, 1)
    showNotification('Task deleted (local only)')
    return
  }
  try {
    await fetch(`/api/posts/${taskToDelete._id}`, { method: 'DELETE' })
    tasks.value.splice(index, 1)
    showNotification('Task deleted successfully')
  } catch (err) {
    console.error('Error deleting task:', err)
    showNotification('Error deleting task on server.')
  }
}

// *** Only a single declaration of showNotification should exist ***
function showNotification(message) {
  snackbar.value.message = message
  snackbar.value.visible = true
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
