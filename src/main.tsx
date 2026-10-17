import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { migrasiFoto } from './db'
import App from './App'

registerSW({ immediate: true })

// Minta browser agar tidak menghapus data otomatis saat penyimpanan menipis.
navigator.storage?.persist?.().catch(() => {})
migrasiFoto().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
