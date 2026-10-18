import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { startAutoFlush } from './api'
import './i18n'
import './index.css'

// Offline support: cache the app shell and replay queued step submissions when back online.
registerSW({ immediate: true })
startAutoFlush()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
