const rateLimit = require("express-rate-limit");
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("./db");

const {
    registerUser,
    loginUser
} = require("./auth");


const app = express();

// ========================================
// CREATE NOTIFICATION HELPER
// ========================================

function createNotification(userId, actorId, type, postId, message) {
    // Never notify users about their own actions
    if (Number(userId) === Number(actorId)) {
        return;
    }

    const sql = `
        INSERT INTO notifications
        (user_id, actor_id, type, post_id, message)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [userId, actorId, type, postId || null, message],
        (err) => {
            if (err) {
                console.error("Create notification error:", err);
            }
        }
    );
}
// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing!");
}
// ========================================
// SESSION
// ========================================

app.use(
    session({

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {

            maxAge: 1000 * 60 * 60 * 24,

            httpOnly: true,

            sameSite: "lax"

        }

    })
);


// ========================================
// STATIC FILES
// ========================================

app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.send(
        "🔥 BariraSocial Server is Running!"
    );

});


// ========================================
// DATABASE TEST
// ========================================

app.get("/api/test", (req, res) => {

    db.query(
        "SELECT 1 AS test",

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    error: err.message

                });

            }


            res.json({

                success: true,

                message:
                    "BariraSocial API + MySQL are connected!",

                database: result

            });

        }

    );

});


// ========================================
// REGISTER
// ========================================

app.post(
    "/api/register",

    async (req, res) => {

        try {

            const {
                name,
                username,
                email,
                password
            } = req.body;


            const result =
                await registerUser(
                    name,
                    username,
                    email,
                    password
                );


            if (!result.success) {

                return res
                    .status(400)
                    .json(result);

            }


            res
                .status(201)
                .json(result);


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error during registration."

            });

        }

    }
);
// ========================================
// LOGIN RATE LIMITER
// ========================================

const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }

});

// ========================================
// LOGIN
// ========================================

app.post(
    "/api/login",
    loginLimiter,

    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            const result = await loginUser(
                email,
                password
            );

            if (!result.success) {

                return res
                    .status(401)
                    .json(result);

            }

            // ==================================
            // REGENERATE SESSION ID
            // ==================================

            req.session.regenerate((err) => {

                if (err) {

                    console.error(
                        "Session regeneration error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Could not create login session."
                    });

                }

                // Save logged-in user
                req.session.user = result.user;

                console.log(
                    "🔥 Session created for:",
                    result.user.username
                );

                // Save session before responding
                req.session.save((saveErr) => {

                    if (saveErr) {

                        console.error(
                            "Session save error:",
                            saveErr
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Could not save login session."
                        });

                    }

                    res.status(200).json({

                        success: true,

                        message: "Login successful!",

                        user: result.user

                    });

                });

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res.status(500).json({

                success: false,

                message: "Server error during login."

            });

        }

    }
);

// ========================================
// CURRENT USER
// ========================================

app.get(
    "/api/me",

    (req, res) => {


        if (!req.session.user) {

            return res
                .status(401)
                .json({

                    success: false,

                    message:
                        "Not logged in."

                });

        }


        res.json({

            success: true,

            user:
                req.session.user

        });

    }
);
// ==================================================
// IMAGE UPLOAD CONFIGURATION
// ==================================================

const uploadFolder = path.join(
    __dirname,
    "uploads"
);

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, PNG, WEBP and GIF images are allowed."
                )
            );
        }
    }

});

// ==========================================
// VERIFY ACTUAL IMAGE FILE CONTENT
// ==========================================

async function validateUploadedImage(req, res, next) {

    if (!req.file) {
        return next();
    }

    try {

        // Inspect the actual uploaded file
        const { fileTypeFromFile } = await import("file-type");

        const detectedType = await fileTypeFromFile(req.file.path);

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        // Reject files that are not genuine supported images
        if (!detectedType || !allowedTypes.includes(detectedType.mime)) {

            await fs.promises.unlink(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Invalid image file. Please upload a genuine JPG, PNG, WEBP or GIF image."
            });

        }

        // Rename using the verified image extension
        const correctPath =
            req.file.path.replace(/\.[^.]+$/, "." + detectedType.ext);

        if (correctPath !== req.file.path) {

            await fs.promises.rename(req.file.path, correctPath);

            req.file.path = correctPath;
            req.file.filename = path.basename(correctPath);

        }

        next();

    } catch (error) {

        console.error("Image validation error:", error);

        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }

        return res.status(400).json({
            success: false,
            message: "Unable to verify this image. Please try another image."
        });

    }

}


// GET A USER'S POSTS
app.get("/api/users/:userId/posts", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Please login first." });
    }

    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({ success: false, message: "Invalid user." });
    }

    const sql = `
        SELECT
            p.id, p.content, p.image, p.created_at,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS user_liked
        FROM posts p
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
    `;

    db.query(sql, [req.session.user.id, userId], (err, results) => {

        if (err) {
            console.error("User posts error:", err);
            return res.status(500).json({ success: false, message: "Failed to load posts." });
        }

        res.json({ success: true, posts: results });
    });
});
// ==========================================
// GET ALL POSTS
// ==========================================

app.get("/api/posts", (req, res) => {

    // Check login
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const currentUserId = req.session.user.id;

    const sql = `
        SELECT
            posts.id,
            posts.content,
            posts.image,
            posts.created_at,

            users.id AS user_id,
            users.name,
            users.username,
            users.profile_image,

            (
                SELECT COUNT(*)
                FROM likes
                WHERE likes.post_id = posts.id
            ) AS like_count,

            (
                SELECT COUNT(*)
                FROM likes
                WHERE likes.post_id = posts.id
                AND likes.user_id = ?
            ) AS user_liked

        FROM posts

        INNER JOIN users
            ON posts.user_id = users.id

        ORDER BY posts.created_at DESC
    `;

    db.query(
        sql,
        [currentUserId],
        (err, results) => {

            if (err) {

                console.error(
                    "Get posts error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to load posts."
                });
            }

            res.json({
                success: true,
                posts: results
            });

        }
    );

});
// LIKE / UNLIKE POST
// ==========================================

app.post("/api/posts/:postId/like", (req, res) => {

    // Check login
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const userId = req.session.user.id;
    const postId = req.params.postId;


    // Check if already liked
    const checkSql = `
        SELECT id
        FROM likes
        WHERE post_id = ?
        AND user_id = ?
    `;

    db.query(
        checkSql,
        [postId, userId],
        (err, results) => {

            if (err) {
                console.error("Like check error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }


            // ==========================================
            // UNLIKE
            // ==========================================

            if (results.length > 0) {

                const deleteSql = `
                    DELETE FROM likes
                    WHERE post_id = ?
                    AND user_id = ?
                `;

                db.query(
                    deleteSql,
                    [postId, userId],
                    (err) => {

                        if (err) {
                            console.error(
                                "Unlike error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Failed to unlike post."
                            });
                        }


                        res.json({
                            success: true,
                            liked: false,
                            message: "Post unliked."
                        });

                    }
                );

                return;
            }


            // ==========================================
            // LIKE
            // ==========================================

            const insertSql = `
                INSERT INTO likes
                (post_id, user_id)
                VALUES (?, ?)
            `;

            db.query(
                insertSql,
                [postId, userId],
                (err) => {

                    if (err) {
                        console.error(
                            "Like error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Failed to like post."
                        });
                    }


                  // Find the owner of the post
db.query(
    "SELECT user_id FROM posts WHERE id = ?",
    [postId],
    (ownerErr, posts) => {
        if (ownerErr) {
            console.error("Like notification owner error:", ownerErr);
        } else if (posts.length > 0) {
            createNotification(
                posts[0].user_id,
                userId,
                "like",
                Number(postId),
                "liked your post."
            );
        }

        res.json({
            success: true,
            liked: true,
            message: "Post liked ❤️"
        });
    }
);

                }
            );

        }
    );

});// GET COMMENTS FOR A POST
app.get("/api/posts/:postId/comments", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const postId = req.params.postId;

    const sql = `
        SELECT
            comments.id,
            comments.comment,
            comments.created_at,

            users.id AS user_id,
            users.name,
            users.username,
            users.profile_image

        FROM comments

        INNER JOIN users
            ON comments.user_id = users.id

        WHERE comments.post_id = ?

        ORDER BY comments.created_at ASC
    `;

    db.query(
        sql,
        [postId],
        (err, results) => {

            if (err) {
                console.error(
                    "Get comments error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to load comments."
                });
            }

            res.json({
                success: true,
                comments: results
            });
        }
    );
});


// CREATE COMMENT
app.post("/api/posts/:postId/comments", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const postId = req.params.postId;
    const userId = req.session.user.id;

    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Comment cannot be empty."
        });
    }

    const sql = `
        INSERT INTO comments
        (post_id, user_id, comment)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [postId, userId, comment.trim()],
        (err, result) => {

            if (err) {
                console.error(
                    "Create comment error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to create comment."
                });
            }

         // Find the post owner and notify them
db.query(
    "SELECT user_id FROM posts WHERE id = ?",
    [postId],
    (ownerErr, posts) => {
        if (ownerErr) {
            console.error("Comment notification owner error:", ownerErr);
        } else if (posts.length > 0) {
            createNotification(
                posts[0].user_id,
                userId,
                "comment",
                Number(postId),
                "commented on your post."
            );
        }

        res.status(201).json({
            success: true,
            message: "Comment added successfully! 💬",
            commentId: result.insertId
        });
    }
);
        }
    );
});
// ==========================================
// CREATE POST
// ==========================================
// ==================================================
// CREATE POST WITH OPTIONAL IMAGE
// ==================================================

app.post(
    "/api/posts",
   upload.single("image"),
validateUploadedImage,
(req, res) => {
        if (!req.session.user) {

            return res.status(401).json({
                success: false,
                message: "Please login first."
            });

        }

        const content =
            req.body.content
            ? req.body.content.trim()
            : "";

        if (!content) {

            return res.status(400).json({
                success: false,
                message: "Post cannot be empty."
            });

        }

        const userId =
            req.session.user.id;

        const image =
            req.file
            ? `/uploads/${req.file.filename}`
            : null;

        const sql = `
            INSERT INTO posts
            (user_id, content, image)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                userId,
                content,
                image
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "Create post error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to create post."
                    });

                }

                res.status(201).json({

                    success: true,

                    message:
                        "Post created successfully! 🚀",

                    postId:
                        result.insertId,

                    image:
                        image

                });

            }
        );

    }
);
// ==========================================
// USER PROFILE
// ==========================================

app.get("/api/profile", (req, res) => {

    // Check login session
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    const userId = req.session.user.id;

    const sql = `
        SELECT
            u.id,
            u.name,
            u.username,
            u.email,
            u.bio,
            u.profile_image,

            (
                SELECT COUNT(*)
                FROM follows
                WHERE following_id = u.id
            ) AS followers,

            (
                SELECT COUNT(*)
                FROM follows
                WHERE follower_id = u.id
            ) AS following,

            (
                SELECT COUNT(*)
                FROM posts
                WHERE user_id = u.id
            ) AS posts

        FROM users u
        WHERE u.id = ?
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            console.error("Profile error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load profile."
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            profile: result[0]
        });
    });
});
// ========================================
// LOGOUT
// ========================================

app.post("/api/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Logout failed."
            });

        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        res.json({
            success: true,
            message: "Logged out successfully."
        });

    });

});

// ==================================================
// FOLLOW / UNFOLLOW USER
// ==================================================

app.post("/api/users/:userId/follow", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const followerId = req.session.user.id;
    const followingId = req.params.userId;

    // Prevent following yourself
    if (Number(followerId) === Number(followingId)) {
        return res.status(400).json({
            success: false,
            message: "You cannot follow yourself."
        });
    }

    // Check whether already following
    const checkSql = `
        SELECT id
        FROM follows
        WHERE follower_id = ?
        AND following_id = ?
    `;

    db.query(
        checkSql,
        [followerId, followingId],
        (err, results) => {

            if (err) {
                console.error(
                    "Follow check error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            // =========================
            // UNFOLLOW
            // =========================

            if (results.length > 0) {

                const deleteSql = `
                    DELETE FROM follows
                    WHERE follower_id = ?
                    AND following_id = ?
                `;

                db.query(
                    deleteSql,
                    [followerId, followingId],
                    (err) => {

                        if (err) {
                            console.error(
                                "Unfollow error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Failed to unfollow."
                            });
                        }

                        return res.json({
                            success: true,
                            following: false,
                            message: "Unfollowed successfully."
                        });

                    }
                );

                return;
            }

            // =========================
            // FOLLOW
            // =========================

            const insertSql = `
                INSERT INTO follows
                (follower_id, following_id)
                VALUES (?, ?)
            `;

            db.query(
                insertSql,
                [followerId, followingId],
                (err) => {

                    if (err) {
                        console.error(
                            "Follow error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Failed to follow."
                        });
                    }

                  createNotification(
    followingId,
    followerId,
    "follow",
    null,
    "started following you."
);

res.json({
    success: true,
    following: true,
    message: "Followed successfully!"
});

                }
            );

        }
    );

});
// ==================================================
// CHECK FOLLOW STATUS
// ==================================================

app.get("/api/users/:userId/follow-status", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const followerId =
        req.session.user.id;

    const followingId =
        req.params.userId;

    const sql = `
        SELECT id
        FROM follows
        WHERE follower_id = ?
        AND following_id = ?
    `;

    db.query(
        sql,
        [followerId, followingId],
        (err, results) => {

            if (err) {

                console.error(
                    "Follow status error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });

            }

            res.json({

                success: true,

                following:
                    results.length > 0

            });

        }
    );

});
// ==========================================
// GET FOLLOWER / FOLLOWING COUNTS
// ==========================================

app.get("/api/users/:userId/follow-counts", (req, res) => {

    const userId = req.params.userId;

    const sql = `
        SELECT
            (SELECT COUNT(*)
             FROM follows
             WHERE following_id = ?) AS followers,

            (SELECT COUNT(*)
             FROM follows
             WHERE follower_id = ?) AS following
    `;

    db.query(
        sql,
        [userId, userId],
        (err, results) => {

            if (err) {

                console.error(
                    "Follow counts error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.json({
                success: true,
                followers: results[0].followers,
                following: results[0].following
            });

        }
    );
});
// ==========================================
// DELETE POST
// ==========================================

app.delete("/api/posts/:postId", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const postId = req.params.postId;
    const userId = req.session.user.id;

    // First check that this post belongs to the logged-in user
    const checkSql = `
        SELECT id, image
        FROM posts
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        checkSql,
        [postId, userId],
        (err, results) => {

            if (err) {
                console.error(
                    "Delete post check error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (results.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You can only delete your own posts."
                });
            }

            const image = results[0].image;

            const deleteSql = `
                DELETE FROM posts
                WHERE id = ?
                AND user_id = ?
            `;

            db.query(
                deleteSql,
                [postId, userId],
                (err) => {

                    if (err) {
                        console.error(
                            "Delete post error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Failed to delete post."
                        });
                    }

                    // Delete uploaded image from server
                    if (image) {

                        const imagePath =
                            path.join(
                                __dirname,
                                image.replace(
                                    "/uploads/",
                                    "uploads/"
                                )
                            );

                        if (fs.existsSync(imagePath)) {
                            fs.unlink(
                                imagePath,
                                (fileErr) => {

                                    if (fileErr) {
                                        console.error(
                                            "Image delete error:",
                                            fileErr
                                        );
                                    }

                                }
                            );
                        }
                    }

                    res.json({
                        success: true,
                        message: "Post deleted successfully!"
                    });

                }
            );

        }
    );

});
// ==========================================
// UPDATE PROFILE
// ==========================================

app.put(
    "/api/profile",
    upload.single("profile_image"),
    (req, res) => {

        // Must be logged in
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const userId = req.session.user.id;

        const name = req.body.name
            ? req.body.name.trim()
            : "";

        const username = req.body.username
            ? req.body.username.trim()
            : "";

        const bio = req.body.bio
            ? req.body.bio.trim()
            : "";

        if (!name || !username) {
            return res.status(400).json({
                success: false,
                message: "Name and username are required."
            });
        }

        // Check whether username is already used
        const checkSql = `
            SELECT id
            FROM users
            WHERE username = ?
            AND id != ?
        `;

        db.query(
            checkSql,
            [username, userId],
            (err, results) => {

                if (err) {
                    console.error(
                        "Username check error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Server error."
                    });
                }

                if (results.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Username already exists."
                    });
                }

                // Get old profile image
                const getUserSql = `
                    SELECT profile_image
                    FROM users
                    WHERE id = ?
                `;

                db.query(
                    getUserSql,
                    [userId],
                    (err, userResults) => {

                        if (err) {
                            console.error(
                                "Get profile error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Server error."
                            });
                        }

                        const oldImage =
                            userResults[0]?.profile_image || null;

                        const newImage =
                            req.file
                                ? `/uploads/${req.file.filename}`
                                : oldImage;

                        const updateSql = `
                            UPDATE users
                            SET
                                name = ?,
                                username = ?,
                                bio = ?,
                                profile_image = ?
                            WHERE id = ?
                        `;

                        db.query(
                            updateSql,
                            [
                                name,
                                username,
                                bio,
                                newImage,
                                userId
                            ],
                            (err) => {

                                if (err) {
                                    console.error(
                                        "Update profile error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: "Failed to update profile."
                                    });
                                }

                                // Remove old image if a new one was uploaded
                                if (
                                    req.file &&
                                    oldImage &&
                                    oldImage !== newImage
                                ) {

                                    const oldImagePath =
                                        path.join(
                                            __dirname,
                                            oldImage.replace(
                                                "/uploads/",
                                                "uploads/"
                                            )
                                        );

                                    if (
                                        fs.existsSync(
                                            oldImagePath
                                        )
                                    ) {
                                        fs.unlink(
                                            oldImagePath,
                                            (fileErr) => {

                                                if (fileErr) {
                                                    console.error(
                                                        "Old image delete error:",
                                                        fileErr
                                                    );
                                                }

                                            }
                                        );
                                    }
                                }

                                // Update session
                                req.session.user.name =
                                    name;

                                req.session.user.username =
                                    username;

                                res.json({
                                    success: true,
                                    message: "Profile updated successfully! 🎉",
                                    user: {
                                        id: userId,
                                        name: name,
                                        username: username,
                                        bio: bio,
                                        profile_image: newImage
                                    }
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);
// ========================================
// START SERVER
// ========================================

const PORT = 3000;

// ======================================================
// YOUR EXISTING ROUTES ABOVE
// ======================================================



// ======================================================
// GET ALL USERS FOR DISCOVERY / PEOPLE YOU MAY KNOW
// ======================================================

app.get("/api/users", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const currentUserId = req.session.user.id;

    const sql = `
        SELECT
            u.id,
            u.name,
            u.username,
            u.bio,
            u.profile_image,

            (
                SELECT COUNT(*)
                FROM follows f1
                WHERE f1.following_id = u.id
            ) AS followers,

            EXISTS (
                SELECT 1
                FROM follows f2
                WHERE f2.follower_id = ?
                AND f2.following_id = u.id
            ) AS following

        FROM users u

        WHERE u.id != ?

        ORDER BY u.created_at DESC

        LIMIT 20
    `;

    db.query(
        sql,
        [currentUserId, currentUserId],
        (err, results) => {

            if (err) {
                console.error(
                    "Users discovery error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to load users."
                });
            }

            res.json({
                success: true,
                users: results
            });

        }
    );

});


// ======================================================
// D1 — PUBLIC USER PROFILE
// ======================================================

app.get("/api/users/:userId/profile", async (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const userId = req.params.userId;
    const currentUserId = req.session.user.id;

    try {

        const [users] = await db.promise().query(
            `
            SELECT
                id,
                name,
                username,
                email,
                bio,
                profile_image,
                created_at
            FROM users
            WHERE id = ?
            `,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = users[0];

        const [postCount] = await db.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM posts
            WHERE user_id = ?
            `,
            [userId]
        );

        const [followerCount] = await db.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM follows
            WHERE following_id = ?
            `,
            [userId]
        );

        const [followingCount] = await db.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM follows
            WHERE follower_id = ?
            `,
            [userId]
        );

        const [followStatus] = await db.promise().query(
            `
            SELECT id
            FROM follows
            WHERE follower_id = ?
            AND following_id = ?
            `,
            [currentUserId, userId]
        );

        res.json({
            success: true,

            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profile_image: user.profile_image,
                created_at: user.created_at
            },

            stats: {
                posts: postCount[0].total,
                followers: followerCount[0].total,
                following: followingCount[0].total
            },

            following: followStatus.length > 0,

            isOwnProfile:
                Number(currentUserId) === Number(userId)
        });

    } catch (error) {

        console.error(
            "Public profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load profile."
        });
    }

});

// ==================================================
// BARIRASOCIAL — NOTIFICATIONS API
// ==================================================


// GET ALL NOTIFICATIONS
app.get("/api/notifications", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const userId = req.session.user.id;

    const sql = `
        SELECT
            n.id,
            n.type,
            n.message,
            n.post_id,
            n.is_read,
            n.created_at,

            u.id AS actor_id,
            u.name AS actor_name,
            u.username AS actor_username,
            u.profile_image AS actor_image

        FROM notifications n

        INNER JOIN users u
            ON n.actor_id = u.id

        WHERE n.user_id = ?

        ORDER BY n.created_at DESC

        LIMIT 50
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Notifications error:", err);

            return res.status(500).json({
                success: false,
                message: "Could not load notifications."
            });
        }

        res.json({
            success: true,
            notifications: results
        });

    });

});


// GET UNREAD NOTIFICATION COUNT
app.get("/api/notifications/unread-count", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const sql = `
        SELECT COUNT(*) AS unread
        FROM notifications
        WHERE user_id = ?
        AND is_read = 0
    `;

    db.query(
        sql,
        [req.session.user.id],
        (err, results) => {

            if (err) {
                console.error("Unread count error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Could not load unread count."
                });
            }

            res.json({
                success: true,
                unread: results[0].unread
            });

        }
    );

});


// MARK ONE NOTIFICATION AS READ
app.patch("/api/notifications/:id/read", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID."
        });
    }

    const sql = `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [notificationId, req.session.user.id],
        (err, result) => {

            if (err) {
                console.error("Mark read error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Could not update notification."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found."
                });
            }

            res.json({
                success: true,
                message: "Notification marked as read."
            });

        }
    );

});


// MARK ALL NOTIFICATIONS AS READ
app.patch("/api/notifications/read-all", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const sql = `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
        AND is_read = 0
    `;

    db.query(
        sql,
        [req.session.user.id],
        (err, result) => {

            if (err) {
                console.error("Read all error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Could not update notifications."
                });
            }

            res.json({
                success: true,
                updated: result.affectedRows,
                message: "All notifications marked as read."
            });

        }
    );

});
// ======================================================
// SERVER START
// ======================================================

app.listen(3000, () => {

    console.log(
        "BariraSocial server is running on http://localhost:3000"
    );

});
