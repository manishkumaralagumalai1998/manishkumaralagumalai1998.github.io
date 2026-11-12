import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// User site (manishkumaralagumalai1998.github.io) is served from the domain root.
export default defineConfig({
  plugins: [vue()],
  base: '/',
})
