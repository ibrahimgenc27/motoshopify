import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    privacyAccepted: boolean;
    commercialConsent: boolean;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
    privacyAccepted: boolean;
    commercialConsent?: boolean;
}

export function useAuth(): AuthState & {
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
} {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: async () => {
            const res = await fetch(api.auth.me.path, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to get user");
            return res.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });

    const loginMutation = useMutation({
        mutationFn: async (loginData: LoginData) => {
            const res = await fetch(api.auth.login.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(loginData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Giriş başarısız");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (registerData: RegisterData) => {
            const res = await fetch(api.auth.register.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(registerData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Kayıt başarısız");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(api.auth.logout.path, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Çıkış başarısız");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });

    const user = data?.user || null;

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login: async (data: LoginData) => {
            await loginMutation.mutateAsync(data);
        },
        register: async (data: RegisterData) => {
            await registerMutation.mutateAsync(data);
        },
        logout: async () => {
            await logoutMutation.mutateAsync();
        },
    };
}
