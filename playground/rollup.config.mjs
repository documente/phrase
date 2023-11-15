import {nodeResolve} from "@rollup/plugin-node-resolve"
export default {
  input: "./src/index.ts",
  output: {
    file: "./public/editor.bundle.js",
    format: "iife"
  },
  plugins: [nodeResolve()]
}
