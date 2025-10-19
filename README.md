# MERN Social

A full-stack social media application built with **MongoDB**, **Express**, **React**, and **Node.js** (MERN).  
Includes real-time chat, image uploads, user roles, and more.


---

## 🧰 Tech Stack

| Layer       | Technologies & Tools                            |
|-------------|--------------------------------------------------|
| Backend     | Node.js, Express, TypeScript, MongoDB, Mongoose |
| Frontend    | React, Vite, TypeScript, React-Bootstrap         |
| Real-time   | Socket.IO                                         |
| Storage     | Cloudinary (for image uploads)                  |
| Auth & Sec  | JSON Web Tokens, Cookie-based auth               |
| Testing     | Jest (backend)                                    |

---

## ⚙️ Features

- **User Registration & Authentication**: sign up, login, logout, JWT tokens stored in cookies  
- **Profiles & User Roles**: view and edit user profiles, admin-level permissions  
- **Posts**: create, edit, delete posts (with optional images)  
- **News Feed**: responsive feed of posts from users  
- **Real-time Chat**: WebSocket-based chat rooms  
- **File Uploads**: image uploading handled via Cloudinary  
- **Role-based Access**: certain actions restricted by user role (e.g. admin features)  

---

## 📂 Project Structure

mern_social/
│
├── api/ # Backend – Express server, API endpoints, WebSocket logic
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── utils/
│ └── ...
│
├── client/ # Frontend – React app built with Vite
│ ├── components/
│ ├── pages/
│ ├── contexts/
│ ├── services/
│ └── ...
│
├── readme_img/ # Images used in README (screenshots, logos)
├── .gitignore
└── README.md (this file)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)  
- npm or yarn  
- MongoDB (local or remote)  
- Cloudinary account (for image uploads)  

### Setup & Run Locally

1. Clone the repo  
   ```bash
   git clone https://github.com/Awiity/mern_social.git
   cd mern_social
   
2. Environment variables
Create .env files in both api/ and client/ (if needed) with keys like:
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=…
CLOUDINARY_API_KEY=…
CLOUDINARY_API_SECRET=…

3. Install dependencies

cd api
npm install
cd ../client
npm install

4. Run development servers
In separate terminals:

# backend
cd api
npm run dev  

# frontend
cd client
npm run dev

5. Open your browser
Visit http://localhost:3000 (or according to your frontend dev server port)

Author & Acknowledgments

Created by Awiity
Thanks to all the open-source tools and libraries used in this project.
