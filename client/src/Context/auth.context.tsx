import axios, { AxiosResponse } from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { ILoginCred } from "../Network/user.api";
axios.defaults.withCredentials = true;

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://opalsocialbe.vercel.app'
    : 'http://localhost:4000';

type User = {
    _id: string;
    username: string,
    email: string;
    role: string;
};

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (cred: ILoginCred) => Promise<AxiosResponse<any, any>>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/auth/me`, { withCredentials: true });
                //console.log( response);
                setUser(response.data);
            } catch (error) {
                console.log("authme/ error");
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        checkAuth();
    }, []);

async function login(credentials: ILoginCred) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.status === 200) {
            setUser(response.data.user);
            console.log("login successful");
        }
        return response;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

    async function logout() {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`);
            setUser(null);
        } catch (error) {
            console.error(error);
        }
        //localStorage.removeItem('auth');
    }
    const value: AuthContextType = {
        user: user,
        isAuthenticated: !!user,
        isLoading: loading,
        login: login,
        logout: logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be within domain of Authprovider...");
    return context;
}