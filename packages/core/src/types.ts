import type { paths } from "./data/petstore";

export type Method =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options";

export type OpenapiPaths<Paths> = {
  [P in keyof Paths]: {
    [M in Method]?: unknown;
  };
};

// export const createOpenApiFetch = <T extends Record<string, unknown>>() => {};

export interface CreateOpenApiFetch<Paths extends OpenapiPaths<Paths>> {
  from: <P extends keyof Paths>(path: P) => PathMethods<Paths, P>;
}

export type PathMethods<
  Paths extends OpenapiPaths<Paths>,
  Path extends keyof Paths
> = {
  [M in keyof Paths[Path]]: PathMethod<M, Paths[Path][M]>;
} & {
  use: (mw: Middleware) => PathMethods<Paths, Path>;
};

export type OperationArgs<OP> = OP extends {
  parameters?: {
    path?: infer P;
    query?: infer Q;
    body?: infer B;
    header?: unknown;
    cookie?: unknown;
  };
  requestBody?: {
    content: {
      "application/json": infer RB;
    };
  };
}
  ? (P & Q extends Record<string, unknown>
      ? {
          query: P & Q;
        }
      : {}) &
      ((B extends Record<string, unknown> ? B[keyof B] : unknown) &
        RB extends Record<string, unknown>
        ? {
            body: (B extends Record<string, unknown> ? B[keyof B] : unknown) &
              RB;
          }
        : {})
  : never;

export interface Middleware {
  (
    url: RequestInfo | URL,
    init: RequestInit,
    next: typeof fetch
  ): Promise<Response>;
}

export type TypedFetchInit = Omit<RequestInit, "body">;

export type TypedFetch<OP, Args extends OperationArgs<OP>> = Args extends never
  ? (args?: TypedFetchInit) => Response
  : (args: TypedFetchInit & Args) => Response;

export type PathMethod<
  M,
  Operation,
  Args extends OperationArgs<Operation> = OperationArgs<Operation>
> = TypedFetch<Operation, Args> & {
  url: Args extends { query: infer P } ? (query: P) => string : () => string;
};
