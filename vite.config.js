import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // BASE_URL es '/NeuroVision/' en GitHub Pages y '/' en dev local
  base: process.env.VITE_BASE_PATH || '/',
})
