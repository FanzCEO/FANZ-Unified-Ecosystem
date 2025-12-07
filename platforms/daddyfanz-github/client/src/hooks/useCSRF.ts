import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { setCSRFToken as storeCSRFToken } from "@/lib/queryClient";

interface CSRFResponse {
  token: string;
}

export function useCSRF() {
  const { data: csrfData, refetch } = useQuery<CSRFResponse>({
    queryKey: ["/api/csrf-token"],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Store CSRF token in module-level cache when it changes
  useEffect(() => {
    if (csrfData?.token) {
      storeCSRFToken(csrfData.token);
    }
  }, [csrfData]);

  const getCSRFToken = useCallback(() => {
    return csrfData?.token || "";
  }, [csrfData]);

  const refreshCSRFToken = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    token: getCSRFToken(),
    getCSRFToken,
    refreshCSRFToken,
  };
}

// Helper hook to add CSRF token to API requests
export function useCSRFHeaders() {
  const { token } = useCSRF();

  const getHeaders = useCallback((additionalHeaders: Record<string, string> = {}) => {
    return {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
      ...additionalHeaders,
    };
  }, [token]);

  return { getHeaders, token };
}
