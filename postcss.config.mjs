import { fileURLToPath } from 'node:url'

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': { base: fileURLToPath(new URL('.', import.meta.url)) },
  },
}

export default config
