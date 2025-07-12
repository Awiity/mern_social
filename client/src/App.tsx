import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import LoginPage from './Pages/login.page';
import { Layout } from './Pages/layout.page';
import { NotFound } from './Pages/notfound.page';
import { NewsPage } from './Pages/news.page';
import { RegisterPage } from './Pages/register.page';
import { UserPage } from './Pages/user.page';
import ChatRoomPage from './Pages/chatroom.page';
import { PostPage } from './Pages/post.page';
import HomePage from './Pages/home.page';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />} >
                    <Route path='login' element={<LoginPage />}></Route>
                    <Route path='' element={<HomePage />}></Route>
                    <Route path='*' element={<NotFound />}></Route>
                    <Route path='news' element={<NewsPage></NewsPage>}></Route>
                    <Route path='register' element={<RegisterPage />}></Route>
                    <Route path='user/:id' element={<UserPage></UserPage>}></Route>
                    <Route path='post/:id' element={<PostPage></PostPage>} ></Route>
                    <Route path='chatroom' element={<ChatRoomPage></ChatRoomPage>}></Route>
                </Route>

            </Routes>
        </BrowserRouter>
    )
}

export default App
