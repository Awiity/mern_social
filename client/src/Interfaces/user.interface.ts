export interface ILoginRes {
    accessToken: string,
    refreshToken: string,
    user: {
        _id: string,
        username: string,
        email: string,
        role: string
    }
}