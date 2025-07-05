import axios from "axios";

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
export async function register(credentials: IRegisterCred) {
    const response = await axios.post("http://localhost:4000/api/auth/register", credentials)
    //if (response.statusText !== "OK") return response
    //localStorage.setItem('auth', response.data);
    return response;
}

export async function updateUser(id: string, body: object) {
    const response = await axios.patch("http://localhost:4000/api/users/:" + id, body);
    return response;
}


/*import axios from "axios";

const api_url: string = "http://localhost:4000/api/"

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