import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  // @napi-rs/keyring is an optional native module — keep it as a runtime import
  // so it resolves from node_modules (or fails gracefully) instead of bundled.
  external: ["@napi-rs/keyring"],
});
