const db = require("../db");

const getPosts = (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const sql = `
    SELECT *
    FROM posts
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json(results);
  });
};

const createPost = (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ message: "userId, title and body are required" });
  }

  const sql = `
    INSERT INTO posts (user_id, title, body)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [userId, title, body], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      title,
      body,
    });
  });
};

const updatePost = (req, res) => {
  const { id } = req.params;
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ message: "userId, title and body are required" });
  }

  const sql = `
    UPDATE posts
    SET title = ?, body = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [title, body, id, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found or not yours" });
    }

    res.json({ message: "Post updated successfully" });
  });
};

const patchPost = (req, res) => {
  const { id } = req.params;
  const { userId, ...fields } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const allowedFields = ["title", "body"];
  const updates = [];
  const values = [];

  for (const key in fields) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  values.push(id, userId);

  const sql = `
    UPDATE posts
    SET ${updates.join(", ")}
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found or not yours" });
    }

    res.json({ message: "Post updated successfully" });
  });
};

const deletePost = (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const sql = `
    DELETE FROM posts
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found or not yours" });
    }

    res.json({ message: "Post deleted successfully" });
  });
};

module.exports = {
  getPosts,
  createPost,
  updatePost,
  patchPost,
  deletePost,
};