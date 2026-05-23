import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  server: { port: 5174, host: '0.0.0.0' },
  plugins: [react()],
  resolve: {
    alias: {
      '@gibens/supabase': resolve(__dirname, '../../packages/supabase/src'),
      '@gibens/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
})
