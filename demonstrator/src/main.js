/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */


import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Components
import App from './App.vue'

// Plugins
import { registerPlugins } from '@/plugins'

const pinia = createPinia()
const app = createApp(App)

registerPlugins(app)

app.use(pinia)
app.mount('#app')
