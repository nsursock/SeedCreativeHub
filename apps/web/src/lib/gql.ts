const API = import.meta.env.VITE_PUBLIC_API_URL ?? "";

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

export type GqlError = { message: string; extensions?: { code?: string } };

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  operationName?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ query, variables, operationName }),
  });

  const json = (await res.json()) as { data?: T; errors?: GqlError[] };
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
  }
  if (!json.data) throw new Error("Empty GraphQL response");
  return json.data;
}
