import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      // These legacy canvas interactions are tracked as warnings while they
      // are incrementally refactored for React Compiler compatibility.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", ".next-dev/**", "out/**", "build/**"]),
]);
