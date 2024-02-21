import { createApp } from 'vue'
import './style.css'
import 'nprogress/nprogress.css'
import "vue-toastification/dist/index.css";

import Toast from "vue-toastification";

import App from './App.vue'

createApp(App)
.use(Toast, {
    // 
})
.mount('#app')
