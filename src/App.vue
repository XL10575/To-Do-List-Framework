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
          <v-btn color="primary" @click="saveTask">
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

// --- 1) Load tasks from server on component mount ---
onMounted(async () => {
  try {
    const res = await fetch('/api/posts')      // <-- calls your GET route
    const data = await res.json()
    tasks.value = data                        // store them in our tasks array
  } catch (err) {
    console.error('Error fetching tasks:', err)
    showNotification('Failed to load tasks from server.')
  }
})

// --- 2) Title validation rules ---
const titleRules = computed(() => [
  v => !!v || 'Title is required',
  v => {
    // If editing, skip the uniqueness check
    if (editMode.value) return true
    const titleLower = v ? v.toLowerCase() : ''
    // Check if any existing tasks share this title
    return tasks.value.every(task => (task.title || '').toLowerCase() !== titleLower)
      || 'Title already exists'
  }
])

function formatDate(date) {
  if (!date) return ''
  const d = (date instanceof Date) ? date : new Date(date)
  return isNaN(d) ? '' : d.toLocaleDateString('en-US')
}

function formatDateForInput(date) {
  const d = (date instanceof Date) ? date : new Date(date)
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

// --- 3) Save or Update a task in the database ---
async function saveTask() {
  // Convert the deadline string to a Date object (or null)
  const deadlineDate = selectedTask.deadline ? new Date(selectedTask.deadline) : null
  if (deadlineDate && isNaN(deadlineDate)) {
    showNotification('Invalid deadline date')
    return
  }

  const taskData = {
    title: selectedTask.title,
    description: selectedTask.description,
    deadline: deadlineDate,
    priority: selectedTask.priority,
    completed: selectedTask.completed
  }

  // If editing, we're currently just updating the local array, but for a real server-based update,
  // you'd create a PUT or PATCH route in your Express server. For now, let's do local only:
  if (editMode.value && selectedIndex.value !== null) {
    tasks.value[selectedIndex.value] = taskData
    showNotification('Task updated (locally) successfully')
  } else {
    // Perform a POST request to add a new task on the server
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      showNotification('Task added successfully')

      // Refresh the task list from the server
      const res = await fetch('/api/posts')
      tasks.value = await res.json()
    } catch (err) {
      console.error('Error adding task:', err)
      showNotification('Error adding task on server.')
    }
  }

  showDialog.value = false
}

// --- 4) Delete a task from the database ---
async function deleteTask(index) {
  const taskToDelete = tasks.value[index]
  // If the server sets an `_id`, use that in the DELETE URL
  if (!taskToDelete._id) {
    // No _id means we never got it from server, so just remove locally
    tasks.value.splice(index, 1)
    showNotification('Task deleted (local only)')
    return
  }

  try {
    await fetch(`/api/posts/${taskToDelete._id}`, {
      method: 'DELETE'
    })
    // Remove from local array
    tasks.value.splice(index, 1)
    showNotification('Task deleted successfully')
  } catch (err) {
    console.error('Error deleting task:', err)
    showNotification('Error deleting task on server.')
  }
}

// Show a snackbar notification
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
