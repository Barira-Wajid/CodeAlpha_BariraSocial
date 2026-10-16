<h1 align="center">🌐 BariraSocial</h1>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=9D7BFF&center=true&vCenter=true&width=650&lines=Welcome+to+BariraSocial!;Connect+With+People;Share+Your+Moments;A+Full-Stack+Social+Media+Platform!" alt="Typing SVG">
</p>

<p align="center">
  <strong>A Modern Full-Stack Social Media Platform</strong>
  <br>
  Developed as part of my CodeAlpha Full Stack Development Internship.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project-Full--Stack-blueviolet?style=for-the-badge">
  <img src="https://img.shields.io/badge/Status-Developed-success?style=for-the-badge">
  <img src="https://img.shields.io/badge/Developer-Barira%20Wajid-purple?style=for-the-badge">
</p>

---

## 🌟 About BariraSocial

BariraSocial is a full-stack social media platform that allows users to connect, share posts, interact with other users, and manage their personal profiles through a modern and responsive interface.

The application provides essential social networking features, including user authentication, image uploads, likes, comments, following, and public profiles.

It demonstrates practical knowledge of frontend development, backend programming, REST API development, database management, and user authentication.

---

## ✨ Features

### 🔐 Authentication & Security

* User Registration
* User Login
* Session-Based Authentication
* Password Hashing with Bcrypt
* Protected User Routes

### 👤 User Profiles

* Personal User Profiles
* Profile Picture Upload
* Edit Profile
* Update Personal Information
* Public User Profiles

### 📝 Posts & Interaction

* Create Posts
* Delete Posts
* Upload Images with Posts
* Image File Validation
* Like and Unlike Posts
* Comment on Posts

### 👥 Social Networking

* Follow Users
* Unfollow Users
* View Public Profiles
* Connect and Interact with Other Users

### 🔔 Notifications

* Notification System

### 📱 User Experience

* Responsive Interface
* Modern Social Media Layout
* Interactive User Interface
* Image Upload Support

---

## 📸 Project Screenshots

*Explore the BariraSocial interface through the screenshots included in this repository.*

---

## 💻 Technologies Used

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
</p>

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Additional Tools & Packages

* Multer
* Bcrypt.js
* Express Session
* Express Rate Limit
* File Type
* Git & GitHub
* Visual Studio Code

---

## 🗄️ Database

BariraSocial uses **MySQL** for storing and managing application data.

The database includes tables for:

| Table      | Purpose                               |
| ---------- | ------------------------------------- |
| `users`    | User accounts and profile information |
| `posts`    | User-created posts                    |
| `comments` | Comments on posts                     |
| `likes`    | Post likes                            |
| `follows`  | Following relationships               |

**Database Name:**

```text
barira_social_db
```

---

## 📂 Project Structure

```text
CodeAlpha_BariraSocial/
│
├── index.html
├── login.html
├── register.html
├── profile.html
├── public-profile.html
├── user.html
│
├── server.js
├── auth.js
├── db.js
│
├── package.json
├── package-lock.json
├── .gitignore
│
├── uploads/
│
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run BariraSocial locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Barira-Wajid/CodeAlpha_BariraSocial.git
```

### 2. Open the Project Folder

```bash
cd CodeAlpha_BariraSocial
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure MySQL

* Start MySQL using XAMPP.
* Open phpMyAdmin.
* Create a database named:

```text
barira_social_db
```

* Create the required database tables.
* Configure your database connection in `db.js`.

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
SESSION_SECRET=your_private_random_secret

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=barira_social_db
```

**Important:** Never upload your `.env` file or expose private credentials on GitHub.

### 6. Start the Server

```bash
node server.js
```

### 7. Open the Application

```text
http://localhost:3000/index.html
```

---

## 🎯 Internship Project

**Organization:** CodeAlpha

**Program:** Full Stack Development Internship

**Project:** Social Media Platform

**Developer:** Barira Wajid

---

## 🚀 Future Improvements

* Real-time messaging
* Enhanced notification functionality
* Real-time updates
* Post sharing
* Advanced search
* More profile customization options

---

## 👩‍💻 Developer

<h2 align="center">Barira Wajid</h2>

<p align="center">
  Full-Stack Web Developer | Creative Designer
</p>

<p align="center">
  <a href="https://github.com/Barira-Wajid">
    <img src="https://img.shields.io/badge/GitHub-Barira--Wajid-181717?style=for-the-badge&logo=github">
  </a>
  <a href="https://www.linkedin.com/in/%20barira-wajid-554701425">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin">
  </a>
  <a href="https://bariraportfolio.rf.gd/">
    <img src="https://img.shields.io/badge/Portfolio-Visit-8B5CF6?style=for-the-badge&logo=googlechrome&logoColor=white">
  </a>
</p>

---

<p align="center">
  <strong>💜 Dream it. Build it. Improve it.</strong>
  <br><br>
  Made with ❤️ by Barira Wajid
  <br><br>
  ⭐ If you like this project, consider giving it a star!
</p>
