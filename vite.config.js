import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base makes the project work on any GitHub Pages repository path.
  base: '/kultuuripesa/'
})
