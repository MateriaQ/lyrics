import { auth } from "@/auth";

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

const healthTokenAuthScheme = {
  type: "apiKey",
  in: "header",
  name: "x-health-token",
  description: "Health authentication token",
} as const;

export const OpenAPI = {
  getPaths: (prefix = "/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);
      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];
        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];
          operation.tags = ["Auth"];
        }
      }
      return reference;
    }) as Promise<any>,
  getComponents: async () => {
    const { components } = (await getSchema()) as any;

    return {
      ...components,
      securitySchemes: {
        ...components.securitySchemes,
        healthTokenAuth: healthTokenAuthScheme,
      },
    };
  },
} as const;
