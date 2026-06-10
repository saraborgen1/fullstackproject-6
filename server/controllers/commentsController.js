const db = require("../db");

const getComments = (req, res) => {
  const { postId, search } = req.query;

  if (!postId) {
    return res.status(400).json({
      message: "postId is required",
    });
  }

  let sql = `
    SELECT id, post_id, user_id, name, email, body
    FROM comments
    WHERE post_id = ?
  `;

  const values = [postId];

  if (search) {
    sql += `
      AND (
        body LIKE ?
        OR name LIKE ?
        OR email LIKE ?
      )
    `;

    values.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  db.query(sql, values, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Server error",
      });
    }

    res.json(results);
  });
};

const createComment = (req, res) => {
  const { postId, userId, name, email, body } = req.body;

  if (!postId || !userId || !name || !email || !body) {
    return res.status(400).json({
      message: "postId, userId, name, email and body are required",
    });
  }

  const sql = `
    INSERT INTO comments (post_id, user_id, name, email, body)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [postId, userId, name, email, body], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.status(201).json({
      id: result.insertId,
      post_id: postId,
      user_id: userId,
      name,
      email,
      body,
    });
  });
};

const updateComment = (req, res) => {
  const { id } = req.params;
  const { userId, name, email, body } = req.body;

  if (!userId || !name || !email || !body) {
    return res.status(400).json({ message: "userId, name, email and body are required" });
  }

  const sql = `
    UPDATE comments
    SET name = ?, email = ?, body = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [name, email, body, id, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Comment not found or not yours" });
    }

    res.json({ message: "Comment updated successfully" });
  });
};

const patchComment = (req, res) => {
  const { id } = req.params;
  const { userId, ...fields } = req.body;

  if (!userId) return res.status(400).json({ message: "userId is required" });

  const allowedFields = ["name", "email", "body"];
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
    UPDATE comments
    SET ${updates.join(", ")}
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Comment not found or not yours" });
    }

    res.json({ message: "Comment updated successfully" });
  });
};

const deleteComment = (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "userId is required" });

  const sql = `
    DELETE FROM comments
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Comment not found or not yours" });
    }

    res.json({ message: "Comment deleted successfully" });
  });
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  patchComment,
  deleteComment,
};