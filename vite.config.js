import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
  port: 3000, // Essayez ce port
  host: '127.0.0.1',
  strictPort: false,
}
})