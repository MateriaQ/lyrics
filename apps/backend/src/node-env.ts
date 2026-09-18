const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : "production";
export const isDev = NODE_ENV === "development" || NODE_ENV === "dev";
export const isProd = NODE_ENV === "production" || NODE_ENV === "prod";
export const isTest = NODE_ENV === "test";
