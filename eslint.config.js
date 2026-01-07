export default [
  {
    files: ["frontend/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-console": "off",
      eqeqeq: "error",
    },
  },
];
