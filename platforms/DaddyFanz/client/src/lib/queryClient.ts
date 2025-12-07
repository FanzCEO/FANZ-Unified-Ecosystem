import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Module-level CSRF token storage
let cachedCSRFToken: string = '';

export function setCSRFToken(token: string) {
  cachedCSRFToken = token;
}

export function getCSRFToken(): string {
  return cachedCSRFToken;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let headers: Record<string, string> = {};
  let body: any = undefined;

  // Include JWT token if available (for local auth)
  const authToken = localStorage.getItem("authToken");
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Add CSRF token to headers for non-safe methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }

  if (data) {
    // Handle FormData (for file uploads)
    if (data instanceof FormData) {
      body = data;
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else {
      // Handle JSON data
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include", // For Replit auth session cookies
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Include JWT token if available (for local auth)
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include", // For Replit auth session cookies
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
