import axios from "axios";
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://opalsocialbe.vercel.app'
    : process.env.DEV_API_URL || 'http://localhost:4000';

export interface ILoginCred {
    email: string | null,
    password: string | null
};

export interface IRegisterCred {
    password: string | null,
    username: string | null,
    firstname: string | null,
    lastname: string | null,
    email: string | null,
    description: string | null,
    address: string | null,
    role: string | "user",
}
axios.defaults.withCredentials = true;
export async function register(credentials: FormData) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, credentials, { withCredentials: true });
    if (response.statusText !== "OK") return response;
    //if (response.statusText !== "OK") return response
    //localStorage.setItem('auth', response.data);
    return response;
}

export async function updateUser(id: string, body: FormData) {
    const response = await axios.patch(`${API_BASE_URL}/api/users/${id}`, body,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
        }
    );
    return response;
}


/*import axios from "axios";


export interface ILoginCred {
    email: string | null,
    password: string | null
};

export interface IRegisterCred {
    password: string,
    username: string,
    firstname: string,
    lastname: string | undefined,
    email: string,
    description: string | undefined,
    address: string | undefined,
    role: string | "user",
}



export async function register(credentials: IRegisterCred) {
    try {
        const response = await axios.post(api_url + "users/", { credentials });
        return response;
    } catch (error) {
        console.error(error);
    }
}*/