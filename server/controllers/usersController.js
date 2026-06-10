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
    SELECT id, name, username, email, phone, blocked, is_admin
    FROM users
    WHERE id = ?
  `;

  const todosSql = `
    SELECT id, user_id, title, completed
    FROM todos
    WHERE user_id = ?
  `;

  const postsSql = `
    SELECT 
      p.id AS post_id,
      p.user_id,
      p.title AS post_title,
      p.body AS post_body,
      c.id AS comment_id,
      c.name AS comment_name,
      c.email AS comment_email,
      c.body AS comment_body,
      c.user_id AS comment_user_id
    FROM posts p
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.user_id = ?
    ORDER BY p.id, c.id
  `;

  const albumsSql = `
    SELECT
      a.id AS album_id,
      a.user_id,
      a.title AS album_title,
      ph.id AS photo_id,
      ph.title AS photo_title,
      ph.url,
      ph.thumbnail_url
    FROM albums a
    LEFT JOIN photos ph ON a.id = ph.album_id
    WHERE a.user_id = ?
    ORDER BY a.id, ph.id
  `;

  db.query(userSql, [id], (err, userResults) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    db.query(todosSql, [id], (err, todosResults) => {
      if (err) return res.status(500).json({ message: "Server error" });

      db.query(postsSql, [id], (err, postsRows) => {
        if (err) return res.status(500).json({ message: "Server error" });

        db.query(albumsSql, [id], (err, albumsRows) => {
          if (err) return res.status(500).json({ message: "Server error" });

          const postsMap = {};

          postsRows.forEach((row) => {
            if (!postsMap[row.post_id]) {
              postsMap[row.post_id] = {
                id: row.post_id,
                user_id: row.user_id,
                title: row.post_title,
                body: row.post_body,
                comments: [],
              };
            }

            if (row.comment_id) {
              postsMap[row.post_id].comments.push({
                id: row.comment_id,
                post_id: row.post_id,
                user_id: row.comment_user_id,
                name: row.comment_name,
                email: row.comment_email,
                body: row.comment_body,
              });
            }
          });

          const albumsMap = {};

          albumsRows.forEach((row) => {
            if (!albumsMap[row.album_id]) {
              albumsMap[row.album_id] = {
                id: row.album_id,
                user_id: row.user_id,
                title: row.album_title,
                photos: [],
              };
            }

            if (row.photo_id) {
              albumsMap[row.album_id].photos.push({
                id: row.photo_id,
                album_id: row.album_id,
                title: row.photo_title,
                url: row.url,
                thumbnail_url: row.thumbnail_url,
              });
            }
          });

          res.json({
            user: userResults[0],
            todos: todosResults,
            posts: Object.values(postsMap),
            albums: Object.values(albumsMap),
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