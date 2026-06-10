const db = require("../db");

const getTodos = (req, res) => {
  const { userId, completed, search } = req.query;

  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
    });
  }

  let sql = `
    SELECT id, user_id, title, completed
    FROM todos
    WHERE user_id = ?
  `;

  const values = [userId];

  if (completed !== undefined) {
    sql += " AND completed = ?";
    values.push(completed === "true");
  }

  if (search) {
    sql += " AND title LIKE ?";
    values.push(`%${search}%`);
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

const createTodo = (req, res) => {
  const { userId, title, completed } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ message: "userId and title are required" });
  }

  const sql = `
    INSERT INTO todos (user_id, title, completed)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [userId, title, completed ?? false], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      title,
      completed: completed ?? false,
    });
  });
};

const patchTodo = (req, res) => {
  const { id } = req.params;
  const { userId, ...fields } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const allowedFields = ["title", "completed"];
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
    UPDATE todos
    SET ${updates.join(", ")}
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found or not yours" });
    }

    res.json({ message: "Todo updated successfully" });
  });
};

const deleteTodo = (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const sql = `
    DELETE FROM todos
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found or not yours" });
    }

    res.json({ message: "Todo deleted successfully" });
  });
};

const updateTodo = (req, res) => {
  const { id } = req.params;
  const { userId, title, completed } = req.body;

  if (!userId || !title || completed === undefined) {
    return res.status(400).json({
      message: "userId, title and completed are required",
    });
  }

  const sql = `
    UPDATE todos
    SET title = ?, completed = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [title, completed, id, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found or not yours" });
    }

    res.json({ message: "Todo updated successfully" });
  });
};

module.exports = {
  getTodos,
  createTodo,
  patchTodo,
  deleteTodo,
  updateTodo,
};
