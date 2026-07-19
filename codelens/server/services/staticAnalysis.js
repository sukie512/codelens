
import { Linter } from "eslint";

const linter = new Linter();

// Define our rule set
const RULES = {
  // errors
  "no-undef": "error",
  "no-unused-vars": "warn",
  "no-unreachable": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty": "warn",
  "no-extra-semi": "warn",
  "no-func-assign": "error",

  // best practices
  "eqeqeq": "warn",              // == instead of ===
  "no-eval": "error",            // eval() is dangerous
  "no-implied-eval": "error",
  "no-console": "warn",          // console.log left in
  "no-alert": "warn",
  "no-var": "warn",              // use let/const instead
  "prefer-const": "warn",

  // security
  "no-new-func": "error",        // new Function() is like eval
  "no-script-url": "error",      // javascript: URLs
};

// Map ESLint severity to our severity
function mapSeverity(eslintSeverity, ruleId) {
  // Always critical for these
  const critical = ["no-eval", "no-new-func", "no-script-url", "no-undef"];
  const high = ["no-unreachable", "no-dupe-keys", "no-duplicate-case", "no-func-assign"];

  if (critical.includes(ruleId)) return "critical";
  if (high.includes(ruleId)) return "high";
  if (eslintSeverity === 2) return "high";
  return "medium";
}

// Human-readable descriptions for each rule
const DESCRIPTIONS = {
  "no-undef": "Variable used before it was defined. This will throw a ReferenceError at runtime.",
  "no-unused-vars": "Variable is declared but never used. Dead code — remove it or use it.",
  "no-unreachable": "Code after a return/throw/break that can never execute.",
  "no-dupe-keys": "Duplicate key in object literal. The second value silently overwrites the first.",
  "no-duplicate-case": "Duplicate case in switch statement. One branch will never be reached.",
  "no-empty": "Empty block statement. Likely missing implementation or forgotten code.",
  "no-extra-semi": "Unnecessary semicolon. Harmless but indicates sloppy code.",
  "no-func-assign": "Reassigning a function declaration. Almost always a bug.",
  "eqeqeq": "Using == instead of ===. Loose equality causes subtle type coercion bugs.",
  "no-eval": "eval() executes arbitrary strings as code. Critical security vulnerability.",
  "no-implied-eval": "setTimeout/setInterval with a string argument behaves like eval.",
  "no-console": "console.log left in production code. Remove before deploying.",
  "no-alert": "alert() blocks the UI thread. Use custom modals instead.",
  "no-var": "var has function scope and hoisting quirks. Use let or const instead.",
  "prefer-const": "Variable is never reassigned. Use const to signal immutability.",
  "no-new-func": "new Function() is equivalent to eval. Critical security risk.",
  "no-script-url": "javascript: URL allows arbitrary code execution. XSS vulnerability.",
};

const SUGGESTIONS = {
  "no-undef": "Define the variable before using it, or import it from the correct module.",
  "no-unused-vars": "Remove the variable, or use it. If intentionally unused, prefix with _.",
  "no-unreachable": "Remove the unreachable code or restructure the control flow.",
  "no-dupe-keys": "Remove the duplicate key and keep only the intended value.",
  "no-duplicate-case": "Remove the duplicate case label.",
  "no-empty": "Add implementation or a comment explaining why it's intentionally empty.",
  "no-extra-semi": "Remove the extra semicolon.",
  "no-func-assign": "Use a variable (const/let) instead of a function declaration if reassignment is needed.",
  "eqeqeq": "Replace == with === for strict equality comparison.",
  "no-eval": "Use JSON.parse() for data, or refactor to avoid dynamic code execution entirely.",
  "no-implied-eval": "Pass a function reference instead of a string: setTimeout(() => fn(), 1000)",
  "no-console": "Remove console.log or replace with a proper logging library.",
  "no-alert": "Use a custom modal component or dialog element instead.",
  "no-var": "Replace var with const (if never reassigned) or let (if reassigned).",
  "prefer-const": "Change let to const since this variable is never reassigned.",
  "no-new-func": "Refactor to avoid dynamic function creation. Use a lookup object or switch statement.",
  "no-script-url": "Use a button with an onClick handler instead of a javascript: URL.",
};

export function runStaticAnalysis(code, language) {
  // Only support JS/TS for now
  const supportedLanguages = ["javascript", "typescript", "jsx", "tsx"];
  
  if (!supportedLanguages.includes(language)) {
    return {
      supported: false,
      issues: [],
      summary: `Static analysis not available for ${language} — AI review only.`
    };
  }

  try {
    const messages = linter.verify(code, {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
          // browser globals
          window: "readonly",
          document: "readonly",
          console: "readonly",
          fetch: "readonly",
          Promise: "readonly",
          // node globals
          process: "readonly",
          require: "readonly",
          module: "readonly",
          __dirname: "readonly",
          setTimeout: "readonly",
          setInterval: "readonly",
          clearTimeout: "readonly",
          clearInterval: "readonly",
        }
      },
      rules: RULES,
    });

    const issues = messages.map(msg => ({
      severity: mapSeverity(msg.severity, msg.ruleId),
      line: msg.line || null,
      title: `${msg.ruleId} — ${msg.message}`,
      description: DESCRIPTIONS[msg.ruleId] || msg.message,
      suggestion: SUGGESTIONS[msg.ruleId] || "Review and fix this issue.",
      source: "static", // tag so UI can show "Static" badge
    }));

    return {
      supported: true,
      issues,
      summary: issues.length === 0
        ? "No static analysis issues found."
        : `Found ${issues.length} issue${issues.length > 1 ? "s" : ""} via static analysis.`
    };

  } catch (err) {
    // Code has syntax errors — ESLint can't parse it
    return {
      supported: true,
      issues: [{
        severity: "critical",
        line: err.lineNumber || null,
        title: "Syntax Error",
        description: err.message,
        suggestion: "Fix the syntax error before running a full review.",
        source: "static",
      }],
      summary: "Syntax error detected — fix before reviewing."
    };
  }
}