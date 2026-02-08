import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - update this to match your repository name
  // If your repo is "restaurants-nearby", the base should be "/restaurants-nearby/"
  // If deploying to root domain, use "/"
  base: process.env.NODE_ENV === 'production' ? '/restaurants-nearby/' : '/',
})
