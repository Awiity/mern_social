/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const api_url: string = "http://localhost:4000/api/";

export interface IPostData {
    title?: string | undefined,
    body?: string | null | undefined,
    user_id?: string | undefined,
    file?: File | null
}

export async function postNew(formData: FormData): Promise<any> {
    const response = await axios.post(api_url + "posts/", formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    console.log('res', response);
    return response;
};

export async function deletePost(id: string) {
    try {
        const response = await axios.delete(api_url + "posts/" + id);
        return response;
    } catch (error) {
        console.error(error)
    }
}
export async function updatePost(id: string, body: object) {
    try {
        const response = await axios.patch(api_url + "posts/" + id, body);
        return response;
    } catch (error) {
        console.error(error);
    }
}