# 🌐 BariraSocial — Full Stack Social Media Platform

BariraSocial is a full-stack social media platform developed as part of my CodeAlpha Full Stack Development Internship.

It allows users to connect, share posts, interact with other users, and manage their profiles through a modern and responsive interface.

## ✨ Features

* 🔐 User Registration and Login
* 👤 User Profiles
* 🖼️ Profile Picture Upload
* ✏️ Edit Profile
* 📝 Create and Delete Posts
* 📸 Image Uploads with File Validation
* ❤️ Like and Unlike Posts
* 💬 Comment on Posts
* 👥 Follow and Unfollow Users
* 🔔 Notification System
* 🌍 Public User Profiles
* 🔒 Session-Based Authentication
* 📱 Responsive User Interface

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Additional Tools

* Multer
* Bcrypt.js
* Express Session
* Express Rate Limit
* File Type

## 📂 Project Structure

```text
barira-social/
│
├── index.html
├── login.html
├── register.html
├── profile.html
├── public-profile.html
├── user.html
├── server.js
├── auth.js
├── db.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Barira-Wajid/CodeAlpha_BariraSocial.git
```

### 2. Open the project folder

```bash
cd CodeAlpha_BariraSocial
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure MySQL

Create a MySQL database named:

```text
barira_social_db
```

Configure the required database tables before running the application.

### 5. Configure environment variables

Create a `.env` file in the project root:

```env
SESSION_SECRET=your_private_random_secret

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=barira_social_db
```

Never publish your `.env` file or share your private credentials.

### 6. Start the server

```bash
node server.js
```

### 7. Open the application

```text
http://localhost:3000/index.html
```

## 🎯 Internship Project

**Organization:** CodeAlpha

**Project:** Social Media Platform

**Developer:** Barira Wajid

**GitHub:** [Barira-Wajid](https://github.com/Barira-Wajid)

## 💜 Developer

Designed and developed by **Barira Wajid**.

This project represents my learning journey in full-stack web development, backend programming, database management, and building interactive web applications.

⭐ If you like this project, consider giving the repository a star!
