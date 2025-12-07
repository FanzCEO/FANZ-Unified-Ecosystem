"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_query_1 = require("@tanstack/react-query");
const queryClient_1 = require("@/lib/queryClient");
function useAuth() {
    const { data: user, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/auth/user"],
        queryFn: (0, queryClient_1.getQueryFn)({ on401: "returnNull" }),
        retry: false,
    });
    return {
        user,
        isLoading,
        isAuthenticated: !!user,
    };
}
