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
export interface IUserContext {
    _id: string,
    username: string,
    email: string,
    role: string
}