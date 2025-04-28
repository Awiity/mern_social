import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import LoginPage from './Pages/login.page';
import { Layout } from './Pages/layout.page';
import { NotFound } from './Pages/notfound.page';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />} >
                    <Route path='login' element={<LoginPage />}></Route>
                    <Route path='*' element={<NotFound />}></Route>
                </Route>

            </Routes>
        </BrowserRouter>
    )
}

export default App
