import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from "path";
import tailwindcss from "tailwindcss";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [
      svelte(),
      // @ts-ignore
      tailwindcss()
    ],
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
      },
    },
  },

})
