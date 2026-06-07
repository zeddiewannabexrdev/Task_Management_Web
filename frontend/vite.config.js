import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path cho GitHub Pages (tên repo)
  base: process.env.NODE_ENV === 'production' ? '/Task_Management_Web/' : '/',
})
