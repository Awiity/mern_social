import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import { AuthProvider } from './Context/auth.context.tsx'

createRoot(document.getElementById('root')!).render(
        <AuthProvider>
            <App />
        </AuthProvider>,
)
