// import { defineConfig } from 'vite'
// import tailwindcss from '@tailwindcss/vite'
// export default defineConfig({
//   plugins: [
//     tailwindcss(),
//   ],
// })


// import { defineConfig } from 'vite'
// import tailwindcss from '@tailwindcss/vite'


// export default defineConfig({
//   plugins: [
//     tailwindcss(),
//   ],
//   server: {
//     host: true, 
  
//   },
// })


import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { qrcode } from 'vite-plugin-qrcode';
 // 👈 fix import

export default defineConfig({
  plugins: [
    tailwindcss(),
    qrcode(),  // 👈 add this
  ],
  server: {
    host: true,
    port: 5173,
  },
})
