const db = require("../db");

const getAlbums = (req, res) => {
    const { userId, search } = req.query;

    if (!userId) {
        return res.status(400).json({
            message: "userId is required",
        });
    }

    let sql = `
    SELECT id, user_id, title
    FROM albums
    WHERE user_id = ?
  `;

    const values = [userId];

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

const createAlbum = (req, res) => {
    const { userId, title } = req.body;

    if (!userId || !title) {
        return res.status(400).json({ message: "userId and title are required" });
    }

    const sql = `
    INSERT INTO albums (user_id, title)
    VALUES (?, ?)
  `;

    db.query(sql, [userId, title], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });

        res.status(201).json({
            id: result.insertId,
            user_id: userId,
            title,
        });
    });
};

const updateAlbum = (req, res) => {
    const { id } = req.params;
    const { userId, title } = req.body;

    if (!userId || !title) {
        return res.status(400).json({ message: "userId and title are required" });
    }

    const sql = `
    UPDATE albums
    SET title = ?
    WHERE id = ? AND user_id = ?
  `;

    db.query(sql, [title, id, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Album not found or not yours" });
        }

        res.json({ message: "Album updated successfully" });
    });
};

const patchAlbum = updateAlbum;

const deleteAlbum = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    const sql = `
    DELETE FROM albums
    WHERE id = ? AND user_id = ?
  `;

    db.query(sql, [id, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Album not found or not yours" });
        }

        res.json({ message: "Album deleted successfully" });
    });
};

module.exports = {
    getAlbums,
    createAlbum,
    updateAlbum,
    patchAlbum,
    deleteAlbum,
};