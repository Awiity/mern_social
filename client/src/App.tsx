import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import LoginPage from './Pages/login.page';
import { Layout } from './Pages/layout.page';
import { NotFound } from './Pages/notfound.page';
import { ProtectedRoute } from './Components/protected.route';
import { NewsPage } from './Pages/news.page';
import { RegisterPage } from './Pages/register.page';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />} >
                    <Route path='login' element={<LoginPage />}></Route>
                    <Route path='*' element={<ProtectedRoute><NotFound /></ProtectedRoute>}></Route>
                    <Route path='news' element={<ProtectedRoute><NewsPage></NewsPage></ProtectedRoute>}></Route>
                    <Route path='register' element={<RegisterPage />}></Route>
                </Route>

            </Routes>
        </BrowserRouter>
    )
}

export default App
