import {
  OpenapiPaths as OpenApiPaths,
  CreateOpenApiFetch,
  PathMethods,
  Middleware,
} from "./types";
import safeJSON from "destr";

const request = async <T>(url: RequestInfo | URL, options?: RequestInit) => {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new OpenApiError(
      res.statusText,
      res.status,
      safeJSON(await res.text())
    );
  }

  let data: T;
  if (res.headers.get("content-type")?.includes("application/json")) {
    data = await res.json();
  } else {
    data = safeJSON(await res.text()) as unknown as T;
  }
  return data as T;
};

const interpolatePath = (
  path: string,
  params: Record<string, unknown> = {}
) => {
  const keys = Object.keys(params);
  if (keys.length === 0) {
    return path;
  }

  return path.replace(/{(\w+)}/g, (_, key) =>
    encodeURIComponent(params[key as keyof typeof params] as string)
  );
};

// const requestWithMiddlewares = async (
//   url: string,
//   options: RequestInit,
//   middlewares: Middleware[]
// ) => {
//   const next = (url: RequestInfo | URL, options?: RequestInit) =>
//     request(url, options).catch((e) => {
//       throw e;
//     });

//   const mw = middlewares.reduceRight(
//     (next, mw) => (url, options) => mw(url, options, next),
//     next
//   );

//   return mw(url, options);
// };

// TODO - Middleware IMPL.

const internalMethods = <
  Paths extends OpenApiPaths<Paths>,
  P extends keyof Paths
>(
  path: P,
  middlewares: Middleware[] = []
) => {
  const methods = <PathMethods<Paths, P>>{
    get: ({ query }: Record<string, unknown> = {}) =>
      request(interpolatePath(String(path), query as {}), {
        method: "GET",
      }),
    post: ({ body, query, ...rest }: Record<string, unknown> = {}) =>
      request(interpolatePath(String(path), query as {}), {
        method: "POST",
        body: JSON.stringify(body),
        ...rest,
      }),
    put: ({ body, query }: Record<string, unknown> = {}) =>
      request(interpolatePath(String(path), query as {}), {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    patch: ({ body, query }: Record<string, unknown> = {}) =>
      request(interpolatePath(String(path), query as {}), {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: ({ query }: Record<string, unknown> = {}) =>
      request(interpolatePath(String(path), query as {}), {
        method: "DELETE",
      }),

    use: (mw) => {
      return internalMethods(path, [...middlewares, mw]);
    },
  };
  return methods;
};

export const createOpenApiFetch = <Paths extends OpenApiPaths<Paths>>() => {
  const fetcher = <CreateOpenApiFetch<Paths>>{
    from: (path) => {
      return internalMethods(path);
    },
  };

  return fetcher;
};

/**
 * Error
 */

class OpenApiError extends Error {
  constructor(message: string, public status: number, public data: unknown) {
    super(message);
    this.name = "OpenApiError";
  }
}
