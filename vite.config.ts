import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

/** `figma:asset/<hash>.png` → `src/assets/figma/` (populate via MADIson: npm run figma:pull). */
function figmaAssetPlugin(root: string): Plugin {
  const figmaDir = path.join(root, 'src', 'assets', 'figma')
  const placeholder = path.join(figmaDir, '_placeholder.png')

  return {
    name: 'figma-asset',
    enforce: 'pre',
    resolveId(id) {
      if (!id.startsWith('figma:asset/')) return null
      const fileName = id.slice('figma:asset/'.length)
      const resolved = path.join(figmaDir, fileName)
      if (fs.existsSync(resolved)) return path.normalize(resolved)
      if (fs.existsSync(placeholder)) return path.normalize(placeholder)
      this.warn(`Missing Figma asset "${fileName}" — add it to src/assets/figma/ (see _placeholder.png).`)
      return path.normalize(resolved)
    },
  }
}

export default defineConfig({
  plugins: [
    // React plugin required for the app shell.
    figmaAssetPlugin(__dirname),
    react(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      /** Project root `assets/` — exported PNGs from design */
      '@project-assets': path.resolve(__dirname, 'assets'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
