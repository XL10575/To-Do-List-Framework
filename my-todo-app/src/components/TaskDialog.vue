<template>
  <v-dialog v-model="internalDialog" max-width="600">
    <v-card>
      <!-- Dialog Title with dynamic text and icon -->
      <v-card-title class="text-h6">
        <v-icon class="me-2">{{ props.isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ props.isEdit ? 'Edit Task' : 'Add Task' }}
      </v-card-title>
      <v-card-text>
        <!-- Form for task inputs -->
        <v-form v-model="isFormValid" @submit.prevent="saveTask" lazy-validation>
          <!-- Title field (hidden in edit mode) -->
          <v-text-field
            v-if="!props.isEdit"
            v-model="localTitle"
            label="Title"
            :rules="titleRules"
            outlined
            required
          />
          <!-- Description field -->
          <v-text-field
            v-model="localDescription"
            label="Description"
            :rules="descriptionRules"
            outlined
            required
            class="mt-3"
          />
          <!-- Deadline date picker field -->
          <v-date-input
            v-model="localDeadline"
            label="Deadline"
            locale="en-US"
            class="mt-3"
          />
          <!-- Priority radio buttons -->
          <v-radio-group v-model="localPriority" label="Priority" class="mt-3">
            <v-radio label="Low" value="low" />
            <v-radio label="Medium" value="med" />
            <v-radio label="High" value="high" />
          </v-radio-group>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- Cancel button to close dialog -->
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <!-- Save button (Add or Update) -->
        <v-btn color="primary" :disabled="!isFormValid" @click="saveTask">
          {{ props.isEdit ? 'Update' : 'Add' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,    // Bound to dialog visibility (v-model from parent)
  isEdit: Boolean,        // Mode: true = edit, false = add
  task: { type: Object, default: () => ({}) },   // Task data (for edit, or empty for add)
  tasks: { type: Array, default: () => [] }      // All existing tasks (for title uniqueness check)
});
const emit = defineEmits(['update:modelValue', 'add-task', 'update-task']);

// Computed binding for v-dialog's v-model (ties to props.modelValue)
const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Local state for form fields
const localTitle = ref('');
const localDescription = ref('');
const localDeadline = ref(null);
const localPriority = ref('low');

// Form validation state (v-form uses this to report overall validity)
const isFormValid = ref(false);

// Validation rules
const titleRules = [
  v => !!v || 'Title is required',
  v => !props.tasks.some(task => task.title.toLowerCase() === v.toLowerCase()) || 'Title already exists'
];
const descriptionRules = [
  v => !!v || 'Description is required'
];

// Watch for dialog opening to initialize form fields
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // When dialog is opened, initialize fields with provided task data
    localTitle.value = props.task.title || '';
    localDescription.value = props.task.description || '';
    localDeadline.value = props.task.deadline ? new Date(props.task.deadline) : null;
    localPriority.value = props.task.priority || 'low';
    isFormValid.value = false;  // reset form validity state
  }
});

// Close the dialog without saving
function close() {
  emit('update:modelValue', false);
}

// Save (Add or Update) the task
function saveTask() {
  if (!isFormValid.value) return;  // safety check, button is disabled if form invalid
  // Prepare task object with form data
  const taskData = {
    title: props.isEdit ? props.task.title : localTitle.value,
    description: localDescription.value,
    deadline: localDeadline.value,
    priority: localPriority.value,
    completed: props.task.completed ?? false
  };
  if (props.isEdit) {
    // Editing an existing task
    emit('update-task', taskData);
  } else {
    // Adding a new task
    emit('add-task', taskData);
  }
  // Close dialog after saving
  emit('update:modelValue', false);
}
</script>

