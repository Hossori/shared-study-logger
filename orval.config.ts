import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "./openapi/api.yaml",
    },
    output: {
      client: "zod",
      mode: "single",
      target: "./shared/generated/api.zod.ts",
      override: {
        zod: {
          version: 4,
          strict: {
            body: false,
            response: false,
            query: false,
            header: false,
            param: false,
          },
          dateTimeOptions: { offset: false },
          generateReusableSchemas: true,
        },
      },
    },
  },
});
