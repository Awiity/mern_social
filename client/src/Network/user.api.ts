const fetchData = async (url: string, opt: object) => {
    try {
        const response = await fetch(url, opt);
        if (response.ok) {
            return response;
        } else {
            const badResponse = await response.json();
            return badResponse;
        }
    } catch (error) {
        console.error(error);
    }
};

export interface ICred {
    email: string | null,
    password: string | null
};

export async function login(credentials: ICred): Promise<null | object> {
    const { email, password } = credentials;
    if (!email || !password) {
        throw new Error("Something's missing");
    }
    const response = await fetchData("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials),
    });
    console.log(response);
    return response;
};

export async function logout() {
    await fetchData("http://localhost:4000/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem('user');
};

export function getToken(): string | null {
    const token = sessionStorage.getItem('user');
    if (token) {
        return token;
    }
    return null;
};
function isTokenExpired(token: string) {
    const tokenExpiration = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= tokenExpiration.exp * 1000;
};


import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:4000',
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        if (isTokenExpired(token)) {
            logout();
            window.dispatchEvent(new Event('unauthorized'));
            return Promise.reject(new Error('Token expired'));
        }
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            logout();
            window.dispatchEvent(new Event('unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default api;