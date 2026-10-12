const bcrypt = require("bcryptjs");
const db = require("./db");

// ========================================
// REGISTER USER
// ========================================

async function registerUser(name, username, email, password) {


// Check required fields
if (
    typeof name !== "string" ||
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !username.trim() ||
    !email.trim() ||
    !password
) {

    return {
        success: false,
        message: "All fields are required."
    };

}

// Clean input
name = name.trim();
username = username.trim().toLowerCase();
email = email.trim().toLowerCase();

// Name validation
if (name.length < 2 || name.length > 60) {

    return {
        success: false,
        message: "Name must be between 2 and 60 characters."
    };

}

// Username validation
if (!/^[a-z0-9_]{3,20}$/.test(username)) {

    return {
        success: false,
        message: "Username must be 3–20 characters and contain only letters, numbers, and underscores."
    };

}

// Email validation
if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
) {

    return {
        success: false,
        message: "Please enter a valid email address."
    };

}

// Password validation
if (password.length < 8) {

    return {
        success: false,
        message: "Password must be at least 8 characters."
    };

}

if (Buffer.byteLength(password, "utf8") > 72) {

    return {
        success: false,
        message: "Password is too long. Maximum is 72 bytes."
    };

}

// Check existing users
const [existingUsers] = await db.promise().query(
    "SELECT id FROM users WHERE username = ? OR email = ?",
    [username, email]
);

if (existingUsers.length > 0) {

    return {
        success: false,
        message: "Username or email already exists."
    };

}

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Save user
const [result] = await db.promise().query(
    "INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)",
    [name, username, email, hashedPassword]
);
return {

    success: true,

    message: "Account created successfully!",

    userId: result.insertId

};


}



// ========================================
// LOGIN USER
// ========================================

async function loginUser(email, password) {

    if (!email || !password) {

        return {
            success: false,
            message: "Email and password are required."
        };

    }

    const [users] = await db.promise().query(
        `SELECT
            id,
            name,
            username,
            email,
            password
         FROM users
         WHERE email = ?`,
        [email]
    );

    if (users.length === 0) {

        return {
            success: false,
            message: "Invalid email or password."
        };

    }

    const user = users[0];

    const passwordMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!passwordMatch) {

        return {
            success: false,
            message: "Invalid email or password."
        };

    }

    return {

        success: true,

        message: "Login successful!",

        user: {

            id: user.id,

            name: user.name,

            username: user.username,

            email: user.email

        }

    };

}


// ========================================
// EXPORT
// ========================================

module.exports = {

    registerUser,

    loginUser

};