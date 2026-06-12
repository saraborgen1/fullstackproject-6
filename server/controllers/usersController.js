const db = require("../db");

const getUserById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, name, username, email, phone, blocked, is_admin
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(results[0]);
  });
};

const updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({
      message: "name, email and phone are required",
    });
  }

  const sql = `
    UPDATE users
    SET name = ?, email = ?, phone = ?
    WHERE id = ?
  `;

  db.query(sql, [name, email, phone, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
    });
  });
};

const deleteUser = (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM users
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Server error",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
    });
  });
};

const patchUser = (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const allowedFields = ["name", "username", "email", "phone"];

  const updates = [];
  const values = [];

  for (const key in fields) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "Invalid fields" });
  }

  values.push(id);

  const sql = `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  });
};

const blockUser = (req, res) => {
  const { id } = req.params;
  const { blocked } = req.body;

  if (blocked === undefined) {
    return res.status(400).json({ message: "blocked is required" });
  }

  const sql = `
    UPDATE users
    SET blocked = ?
    WHERE id = ?
  `;

  db.query(sql, [blocked, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User block status updated successfully" });
  });
};

const changePassword = (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      message: "oldPassword and newPassword are required",
    });
  }

  const sql = `
    UPDATE users
    SET website = ?
    WHERE id = ? AND website = ?
  `;

  db.query(sql, [newPassword, id, oldPassword], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Old password is incorrect",
      });
    }

    res.json({
      message: "Password changed successfully",
    });
  });
};

const getUserDashboard = (req, res) => {
  const { id } = req.params;

  const userSql = `
    SELECT id, name, username
    FROM users
    WHERE id = ?
  `;

  const todoCountSql = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed
    FROM todos
    WHERE user_id = ?
  `;

  const postCountSql = `
    SELECT COUNT(*) AS total
    FROM posts
    WHERE user_id = ?
  `;

  const albumCountSql = `
    SELECT COUNT(*) AS total
    FROM albums
    WHERE user_id = ?
  `;

  db.query(userSql, [id], (err, userResults) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    db.query(todoCountSql, [id], (err, todoResults) => {
      if (err) return res.status(500).json({ message: "Server error" });

      db.query(postCountSql, [id], (err, postResults) => {
        if (err) return res.status(500).json({ message: "Server error" });

        db.query(albumCountSql, [id], (err, albumResults) => {
          if (err) return res.status(500).json({ message: "Server error" });

          res.json({
            user: userResults[0],
            todoCount: todoResults[0].total,
            completedTodoCount: todoResults[0].completed,
            postCount: postResults[0].total,
            albumCount: albumResults[0].total,
          });
        });
      });
    });
  });
};

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
  patchUser,
  blockUser,
  changePassword,
  getUserDashboard,
};