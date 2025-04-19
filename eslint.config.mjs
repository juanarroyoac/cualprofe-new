import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Change unused vars from error to warning
      // This allows the build to complete while still providing feedback during development
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Keep most other rules as errors for good code quality
      "no-console": "warn", // Consider removing console.logs in production
      "no-debugger": "error",
      "no-undef": "error",
      "no-unused-expressions": "error",
      "react/prop-types": "off", // TypeScript handles prop types
    },
  },
];

export default eslintConfig;