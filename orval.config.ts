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
  client: {
    input: {
      target: "./openapi/api.yaml",
    },
    output: {
      client: "axios-functions",
      mode: "single",
      target: "./src/react-app/api/client.ts",
      override: {
        mutator: {
          path: "./src/react-app/lib/api-mutator.ts",
          name: "apiMutator",
        },
        axios: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
});
