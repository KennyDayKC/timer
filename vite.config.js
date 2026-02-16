import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/timer/', // 這裡一定要改成你的 Repository 名字，前後都要有斜線
})
