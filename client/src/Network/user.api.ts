import axios from "axios";

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

export async function signUp(credentials: IRegisterCred) {
    const response = await axios.post("http://localhost:4000/api/users/", credentials)
    return response;
}

export async function updateUser(id: string, body: object) {
    const response = await axios.patch("http://localhost:4000/api/users/", body);
    return response;
}

export async function login(credentials: ILoginCred) {
    const response = await axios.post("http://localhost:4000/api/auth/login", credentials);
    console.log("network.user.login.res: ", response);
    return response;
}

export async function logout() {
    await axios.post("http://localhost:4000/api/auth/logout");
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

export async function login(credentials: ILoginCred) {
    const { email, password } = credentials;
    if (!email || !password) {
        throw new Error("Something's missing");
    }
    const response = await axios.post(api_url + "auth/login", {
        credentials,
    });
    console.log(response);
    return response;
};

export async function register(credentials: IRegisterCred) {
    try {
        const response = await axios.post(api_url + "users/", { credentials });
        return response;
    } catch (error) {
        console.error(error);
    }
}*/