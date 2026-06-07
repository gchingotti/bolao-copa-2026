import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Troque 'bolao-copa2026' pelo nome EXATO do seu repositório no GitHub
// Ex: se o repo for github.com/gabriel/bolao-copa2026, deixe como está
// Ex: se for github.com/gabriel/copa, mude para '/copa/'
export default defineConfig({
  plugins: [react()],
  base: '/bolao-copa2026/',
})