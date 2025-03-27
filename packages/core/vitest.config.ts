/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'test': resolve(__dirname, './src/test.ts')
    }
  },
  test: {
    include: ['./src/**/*.test.ts'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
      include: ['./src/**/*.test.ts'],
      ignoreSourceErrors: true,
      allowJs: false
    }
  }
})
