const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Username already exists" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- WATCH HISTORY ---

app.get("/api/history", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM watch_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/history", authenticateToken, async (req, res) => {
  const { item_id, item_type, title, poster } = req.body;
  try {
    const timestamp = Date.now();
    await pool.query(
      `INSERT INTO watch_history (user_id, item_id, item_type, title, poster, timestamp) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id, item_id, item_type) 
       DO UPDATE SET timestamp = EXCLUDED.timestamp, title = EXCLUDED.title, poster = EXCLUDED.poster`,
      [req.user.id, item_id.toString(), item_type, title, poster, timestamp]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/history", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM watch_history WHERE user_id = $1", [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- WATCH LATER ---

app.get("/api/watchlater", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM watch_later WHERE user_id = $1 ORDER BY added_at DESC", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/watchlater", authenticateToken, async (req, res) => {
  const { item_id, item_type, title, poster } = req.body;
  try {
    const result = await pool.query("SELECT id FROM watch_later WHERE user_id = $1 AND item_id = $2 AND item_type = $3", [req.user.id, item_id.toString(), item_type]);
    
    if (result.rows.length > 0) {
      await pool.query("DELETE FROM watch_later WHERE id = $1", [result.rows[0].id]);
      res.json({ action: "removed" });
    } else {
      await pool.query(
        "INSERT INTO watch_later (user_id, item_id, item_type, title, poster, added_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [req.user.id, item_id.toString(), item_type, title, poster, Date.now()]
      );
      res.json({ action: "added" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- CONTINUE WATCHING ---

app.get("/api/continuewatching", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM continue_watching WHERE user_id = $1 ORDER BY updated_at DESC", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/continuewatching", authenticateToken, async (req, res) => {
  const { item_id, item_type, title, poster, season, episode } = req.body;
  try {
    await pool.query(
      `INSERT INTO continue_watching (user_id, item_id, item_type, title, poster, season, episode, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (user_id, item_id, item_type) 
       DO UPDATE SET updated_at = EXCLUDED.updated_at, season = EXCLUDED.season, episode = EXCLUDED.episode, title = EXCLUDED.title, poster = EXCLUDED.poster`,
      [req.user.id, item_id.toString(), item_type, title, poster, season || null, episode || null, Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/continuewatching/:item_id/:item_type", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM continue_watching WHERE user_id = $1 AND item_id = $2 AND item_type = $3", [req.user.id, req.params.item_id, req.params.item_type]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/continuewatching", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM continue_watching WHERE user_id = $1", [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
