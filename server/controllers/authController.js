const db = require("../db");

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "username and password are required",
    });
  }

  const sql = `
    SELECT id, name, username, email, phone, blocked, is_admin
    FROM users
    WHERE username = ? AND website = ?
  `;

  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (results[0].blocked) {
      return res.status(403).json({ message: "You are blocked by an administrator!" });
    }

    res.json(results[0]);
  });
};

const register = (req, res) => {
  const { name, username, email, phone, website } = req.body;

  if (!name || !username || !email || !phone || !website) {
    return res.status(400).json({
      message:
        "name, username, email, phone and website are required",
    });
  }

  const sql = `
    INSERT INTO users (name, username, email, phone, website)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, username, email, phone, website], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Username or email already exists",
        });
      }

      return res.status(500).json({
        message: "Server error",
      });
    }

    res.status(201).json({
      id: result.insertId,
      name,
      username,
      email,
      phone,
    });
  });
};

module.exports = {
  login,
  register,
};