import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Scoped to the one file that shipped this bug, because the rule is
    // lexical and elsewhere it flags correct code. The mission thread page read
    // `const threadUrl` on the line above its own declaration, so every load
    // threw a temporal-dead-zone ReferenceError before it could fetch: no
    // request, no `setDataLoaded`, no `setLoadError`. The page sat on its
    // spinner forever and the access check below it never ran. It typechecked,
    // it read correctly, and it was completely broken at runtime.
    // `[id]` is a dynamic route segment, and in glob syntax a literal bracket
    // has to be escaped or it reads as a character class — so match the file
    // name instead. Verified with `eslint --print-config`, because an override
    // that silently does not match is worse than no override at all.
    files: ["src/app/manage/**/ManageThreadClient.tsx"],
    rules: {
      "no-use-before-define": ["error", { functions: false, classes: false, variables: true }],
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
