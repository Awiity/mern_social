import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    ReactNode,
} from 'react';

interface User {
    userId: string;
    username: string;
    exp: number;
    // Add other user properties from your JWT payload
}

interface AuthTokens {
    access: string;
    refresh: string;
}

interface AuthContextType {
    user: User | null;
    authTokens: AuthTokens | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    authFetch: typeof fetch;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
    const [loading, setLoading] = useState(true);
    const refreshPromise = useRef<Promise<string> | null>(null);

    const decodeJWT = useCallback((token: string): User | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            const tokens = localStorage.getItem('authTokens');
            if (tokens) {
                try {
                    const parsedTokens: AuthTokens = JSON.parse(tokens);
                    if (parsedTokens.access && parsedTokens.refresh) {
                        const userData = decodeJWT(parsedTokens.access);
                        if (userData) {
                            setAuthTokens(parsedTokens);
                            setUser(userData);
                        }
                    }
                } catch (error) {
                    console.error('Error initializing auth:', error);
                    localStorage.removeItem('authTokens');
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [decodeJWT]);

    const login = useCallback(async (username: string, password: string) => {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const tokens: AuthTokens = await response.json();
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        setAuthTokens(tokens);
        const userData = decodeJWT(tokens.access);
        if (userData) {
            setUser(userData);
        }
    }, [decodeJWT]);

    const logout = useCallback(() => {
        localStorage.removeItem('authTokens');
        setAuthTokens(null);
        setUser(null);
    }, []);

    const refreshToken = useCallback(async (): Promise<string> => {
        try {
            if (!authTokens?.refresh) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('/api/auth/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: authTokens.refresh }),
            });

            if (!response.ok) {
                throw new Error('Refresh failed');
            }

            const data: { access: string } = await response.json();
            const newTokens: AuthTokens = { ...authTokens, access: data.access };

            localStorage.setItem('authTokens', JSON.stringify(newTokens));
            setAuthTokens(newTokens);

            return newTokens.access;
        } catch (error) {
            logout();
            throw error;
        }
    }, [authTokens, logout]);

    const authFetch = useCallback(async (
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> => {
        let token = authTokens?.access;

        if (token) {
            const decoded = decodeJWT(token);
            if (decoded && decoded.exp * 1000 < Date.now()) {
                if (!refreshPromise.current) {
                    refreshPromise.current = refreshToken();
                }
                try {
                    token = await refreshPromise.current;
                } finally {
                    refreshPromise.current = null;
                }
            }
        }

        const headers = new Headers(init?.headers);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(input, {
            ...init,
            headers,
        });

        if (response.status === 401) {
            logout();
        }

        return response;
    }, [authTokens, refreshToken, logout, decodeJWT]);

    const contextValue = useMemo(() => ({
        user,
        authTokens,
        loading,
        login,
        logout,
        authFetch,
    }), [user, authTokens, loading, login, logout, authFetch]);

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};