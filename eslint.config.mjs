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

  // Disallow .tsx files in src/types and all nested folders.
  {
    files: ["src/types/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: "TSX files are not allowed in src/types.",
        },
      ],
    },
  },

  // Enforce type-only files in src/types.
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",

        // Disallow runtime values:
        // const A = ...
        // let A = ...
        // var A = ...
        {
          selector: "VariableDeclaration",
          message: "Runtime values are not allowed in src/types. Use type or interface declarations only.",
        },

        // Disallow:
        // A = ...
        {
          selector: "AssignmentExpression",
          message: "Assignments are not allowed in src/types.",
        },

        // Disallow:
        // function foo() {}
        {
          selector: "FunctionDeclaration",
          message: "Functions are not allowed in src/types.",
        },

        // Disallow:
        // const foo = () => {}
        {
          selector: "ArrowFunctionExpression",
          message: "Arrow functions are not allowed in src/types.",
        },

        // Disallow:
        // const foo = function () {}
        {
          selector: "FunctionExpression",
          message: "Function expressions are not allowed in src/types.",
        },

        // Disallow:
        // declare function foo(): void
        {
          selector: "TSDeclareFunction",
          message: "Declared functions are not allowed in src/types.",
        },

        // Disallow classes.
        {
          selector: "ClassDeclaration",
          message: "Classes are not allowed in src/types.",
        },
        {
          selector: "ClassExpression",
          message: "Class expressions are not allowed in src/types.",
        },

        // Disallow enums because they create runtime values unless const enum,
        // and even const enum is better avoided if you want type-only files.
        {
          selector: "TSEnumDeclaration",
          message: "Enums are not allowed in src/types. Use union types instead.",
        },

        // Disallow namespace/module runtime-style declarations.
        {
          selector: "TSModuleDeclaration[id.value!='next-intl']",
          message: "Only `declare module \"next-intl\"` is allowed in src/types.",
        },

        // Disallow non-type imports:
        // import { A } from "..."
        // import A from "..."
        {
          selector:
            "ImportDeclaration[importKind!='type']:not([source.value=/^@\\/constants(\\/.*)?$/])",
          message:
            "Only type imports are allowed in src/types, except value imports from @/constants.",
        },
        {
          selector:
            "ImportDeclaration[source.value=/^@\\/constants(\\/.*)?$/] ImportDefaultSpecifier",
          message:
            "Default imports from @/constants are not allowed in src/types. Use named imports only.",
        },

        // Disallow runtime exports:
        // export const A = ...
        // export function foo() {}
        // export { A }
        {
          selector: "ExportNamedDeclaration[exportKind!='type']",
          message: "Only type exports are allowed in src/types.",
        },

        // Disallow:
        // export default ...
        {
          selector: "ExportDefaultDeclaration",
          message: "Default exports are not allowed in src/types. Use named type exports.",
        },

        // Disallow:
        // export * from "..."
        // because it may re-export runtime values.
        {
          selector: "ExportAllDeclaration[exportKind!='type']",
          message: "Only type re-exports are allowed in src/types. Use `export type * from ...`.",
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
