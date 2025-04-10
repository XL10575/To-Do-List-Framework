// src/main.js
import { createApp } from 'vue'
import App from './App.vue'

// 1. Import Vuetify styles and MDI icons
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// 2. Create Vuetify instance
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives
})

// 3. Mount Vue + Vuetify
createApp(App)
  .use(vuetify)
  .mount('#app')
