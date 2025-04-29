import { ILoginRes } from "../Interfaces/user.interface";

export function AuthContext({children} : {children: React.ReactNode}){
    const storedAuth: ILoginRes = localStorage.getItem('auth');
    const [user, setUser] = useState<object | null>(storedAuth.user);
    
}