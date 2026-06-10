const db = require("../db");

const getUserById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, name, username, email, phone, website
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
  const { name, email, phone, website } = req.body;

  if (!name || !email || !phone || !website) {
    return res.status(400).json({
      message: "name, email, phone and website are required",
    });
  }

  const sql = `
    UPDATE users
    SET name = ?, email = ?, phone = ?, website = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, email, phone, website, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User updated successfully",
      });
    }
  );
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

  const allowedFields = ["name", "username", "email", "phone", "website"];

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

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
  patchUser,
};