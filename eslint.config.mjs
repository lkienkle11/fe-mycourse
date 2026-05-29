import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Cấm file .tsx trong src/constants và mọi thư mục con/cháu
  {
    files: ["src/constants/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: "TSX files are not allowed in src/constants.",
        },
      ],
    },
  },

  // Ràng buộc cho toàn bộ file .ts trong src/constants
  {
    files: ["src/constants/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
  
        {
          selector: "FunctionDeclaration",
          message: "Functions are not allowed in src/constants.",
        },
  
        {
          selector: "ArrowFunctionExpression",
          message: "Arrow functions are not allowed in src/constants.",
        },
  
        {
          selector: "FunctionExpression",
          message: "Function expressions are not allowed in src/constants.",
        },
  
        {
          selector: "MethodDefinition",
          message: "Methods are not allowed in src/constants.",
        },
  
        {
          selector: "Property[method=true]",
          message: "Object methods are not allowed in src/constants.",
        },
  
        {
          selector: "TSDeclareFunction",
          message: "Declared functions are not allowed in src/constants.",
        },
  
        {
          selector: "TSTypeAliasDeclaration",
          message: "Type aliases are not allowed in src/constants.",
        },
  
        {
          selector: "TSInterfaceDeclaration",
          message: "Interfaces are not allowed in src/constants.",
        },
  
        {
          selector: "ExportNamedDeclaration[exportKind='type']",
          message: "Exporting types or interfaces is not allowed in src/constants.",
        },
  
        {
          selector: "ExportSpecifier[exportKind='type']",
          message: "Exporting types or interfaces is not allowed in src/constants.",
        },
  
        {
          selector: "ExportAllDeclaration[exportKind='type']",
          message: "Re-exporting types or interfaces is not allowed in src/constants.",
        },
  
        {
          selector: "ExportNamedDeclaration > FunctionDeclaration",
          message: "Exporting functions is not allowed in src/constants.",
        },
  
        {
          selector: "ExportDefaultDeclaration > FunctionDeclaration",
          message: "Default-exporting functions is not allowed in src/constants.",
        },
  
        {
          selector:
            "ExportDefaultDeclaration > ArrowFunctionExpression, ExportDefaultDeclaration > FunctionExpression",
          message: "Default-exporting functions is not allowed in src/constants.",
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
