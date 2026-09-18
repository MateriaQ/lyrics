import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
export type Permission = {
  [K in keyof typeof statements]?: Array<ArrayElement<(typeof statements)[K]>>;
};

const statements = {
  ...defaultStatements,
  lyrics: ["create", "update", "delete", "view"] as const,
};

export const ac = createAccessControl(statements);

const admin = ac.newRole({
  lyrics: ["create", "update", "delete", "view"],
  ...adminAc.statements,
});

const contributor = ac.newRole({
  lyrics: ["create", "update", "view"],
});

const user = ac.newRole({
  lyrics: ["view"],
});

export const roles = {
  admin,
  user,
  contributor,
};
