const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("littleloop.db");

app.use(express.json());

// Database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    PRIMARY KEY (follower_id, following_id)
  );
`);

// First user: neenu
db.prepare(`
  INSERT OR IGNORE INTO users (id, name, username)
  VALUES (1, 'Alex Morgan', 'alexmorgan')
`).run();

// Website files serve maadodu
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/app.js", (req, res) => {
  res.sendFile(path.join(__dirname, "app.js"));
});

// Ella posts retrieve maadodu
app.get("/api/posts", (req, res) => {
  const posts = db.prepare(`
    SELECT posts.id, posts.message, posts.created_at,
           users.name, users.username,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes
    FROM posts
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.id DESC
  `).all();

  res.json(posts);
});

// Hosa post create maadodu
app.post("/api/posts", (req, res) => {
  const message = String(req.body.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Post text is required" });
  }

  const result = db.prepare(`
    INSERT INTO posts (user_id, message)
    VALUES (1, ?)
  `).run(message);

  res.status(201).json({
    id: result.lastInsertRowid,
    name: "Alex Morgan",
    username: "alexmorgan",
    message: message,
    likes: 0
  });
});

// Post like maadodu / unlike maadodu
app.post("/api/posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);

  const alreadyLiked = db.prepare(`
    SELECT 1 FROM likes WHERE user_id = 1 AND post_id = ?
  `).get(postId);

  if (alreadyLiked) {
    db.prepare(`
      DELETE FROM likes WHERE user_id = 1 AND post_id = ?
    `).run(postId);
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO likes (user_id, post_id)
      VALUES (1, ?)
    `).run(postId);
  }

  const totalLikes = db.prepare(`
    SELECT COUNT(*) AS count FROM likes WHERE post_id = ?
  `).get(postId).count;

  res.json({ liked: !alreadyLiked, likes: totalLikes });
});

// Post-ge comment add maadodu
app.post("/api/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const message = String(req.body.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  db.prepare(`
    INSERT INTO comments (user_id, post_id, message)
    VALUES (1, ?, ?)
  `).run(postId, message);

  res.status(201).json({ message: "Comment added" });
});

// Users list maadodu
app.get("/api/users", (req, res) => {
  const users = db.prepare(`
    SELECT id, name, username FROM users ORDER BY name
  `).all();

  res.json(users);
});

// Hosa user profile create maadodu
app.post("/api/users", (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();

  if (!name || !username) {
    return res.status(400).json({ error: "Name and username are required" });
  }

  try {
    const result = db.prepare(`
      INSERT INTO users (name, username) VALUES (?, ?)
    `).run(name, username);

    res.status(201).json({
      id: result.lastInsertRowid,
      name: name,
      username: username
    });
  } catch (error) {
    res.status(409).json({ error: "That username is already taken" });
  }
});

// User-na follow / unfollow maadodu
app.post("/api/users/:id/follow", (req, res) => {
  const followingId = Number(req.params.id);

  if (followingId === 1) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const alreadyFollowing = db.prepare(`
    SELECT 1 FROM follows
    WHERE follower_id = 1 AND following_id = ?
  `).get(followingId);

  if (alreadyFollowing) {
    db.prepare(`
      DELETE FROM follows
      WHERE follower_id = 1 AND following_id = ?
    `).run(followingId);
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO follows (follower_id, following_id)
      VALUES (1, ?)
    `).run(followingId);
  }

  res.json({ following: !alreadyFollowing });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`LittleLoop running at http://localhost:${PORT}`);
});