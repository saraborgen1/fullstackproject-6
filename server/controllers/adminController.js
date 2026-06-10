const db = require("../db");

const checkAdmin = (adminId, callback) => {
  const sql = `
    SELECT is_admin
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [adminId], (err, results) => {
    if (err) return callback(err);

    if (results.length === 0 || !results[0].is_admin) {
      return callback(null, false);
    }

    callback(null, true);
  });
};

const getStatistics = (req, res) => {
  const { adminId } = req.query;

  if (!adminId) {
    return res.status(400).json({ message: "adminId is required" });
  }

  checkAdmin(adminId, (err, isAdmin) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE blocked = TRUE) AS blockedUsers,
        (SELECT COUNT(*) FROM users WHERE is_admin = TRUE) AS admins,
        (SELECT COUNT(*) FROM todos) AS todos,
        (SELECT COUNT(*) FROM todos WHERE completed = TRUE) AS completedTodos,
        (SELECT COUNT(*) FROM posts) AS posts,
        (SELECT COUNT(*) FROM comments) AS comments,
        (SELECT COUNT(*) FROM albums) AS albums,
        (SELECT COUNT(*) FROM photos) AS photos
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ message: "Server error" });

      res.json(results[0]);
    });
  });
};

const getAllUsersForAdmin = (req, res) => {
  const { adminId } = req.query;

  if (!adminId) {
    return res.status(400).json({ message: "adminId is required" });
  }

  checkAdmin(adminId, (err, isAdmin) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sql = `
      SELECT id, name, username, email, phone, blocked, is_admin
      FROM users
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ message: "Server error" });

      res.json(results);
    });
  });
};

const updateAdminStatus = (req, res) => {
  const { id } = req.params;
  const { adminId, is_admin } = req.body;

  if (!adminId) {
    return res.status(400).json({ message: "adminId is required" });
  }

  if (is_admin === undefined) {
    return res.status(400).json({ message: "is_admin is required" });
  }

  checkAdmin(adminId, (err, isAdmin) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sql = `
      UPDATE users
      SET is_admin = ?
      WHERE id = ?
    `;

    db.query(sql, [is_admin, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Admin status updated successfully" });
    });
  });
};

module.exports = {
  getStatistics,
  getAllUsersForAdmin,
  updateAdminStatus,
};