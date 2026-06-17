import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  // keytar is an optional native module — keep it as a runtime import so it
  // resolves from node_modules (or fails gracefully) instead of being bundled.
  external: ["keytar"],
});
