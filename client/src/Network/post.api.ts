import axios from "axios";

const api_url: string = "localhost:4000/api/";

export interface IPostData {
    title: string,
    body: string | null,
    authorId: string,
    fileAttached: string | null
}

export async function postNew(newPost: IPostData) {
    try {
        const response = await axios.post(api_url + "posts/", newPost);
        return response;
    } catch (error) { console.error(error) }
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