const db = require("../db");

const getPhotos = (req, res) => {
    const { albumId, search, page, limit } = req.query;

    if (!albumId) {
        return res.status(400).json({
            message: "albumId is required",
        });
    }

    let countSql = `SELECT COUNT(*) AS total FROM photos WHERE album_id = ?`;
    let sql = `
    SELECT id, album_id, title, url, thumbnail_url
    FROM photos
    WHERE album_id = ?
  `;

    const values = [albumId];
    const countValues = [albumId];

    if (search) {
        sql += " AND title LIKE ?";
        countSql += " AND title LIKE ?";
        values.push(`%${search}%`);
        countValues.push(`%${search}%`);
    }

    // Get total count first
    db.query(countSql, countValues, (countErr, countResults) => {
        if (countErr) {
            return res.status(500).json({ message: "Server error" });
        }

        const total = countResults[0].total;

        // Apply pagination if page and limit are provided
        if (page !== undefined && limit !== undefined) {
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, parseInt(limit, 10) || 6);
            const offset = (pageNum - 1) * limitNum;
            sql += ` ORDER BY id ASC LIMIT ? OFFSET ?`;
            values.push(limitNum, offset);
        } else {
            sql += ` ORDER BY id ASC`;
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Server error",
                });
            }

            res.json({ photos: results, total });
        });
    });
};

const createPhoto = (req, res) => {
    const { albumId, title, url, thumbnailUrl } = req.body;

    if (!albumId || !title || !url) {
        return res.status(400).json({ message: "albumId, title and url are required" });
    }

    const sql = `
    INSERT INTO photos (album_id, title, url, thumbnail_url)
    VALUES (?, ?, ?, ?)
  `;

    db.query(sql, [albumId, title, url, thumbnailUrl || null], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });

        res.status(201).json({
            id: result.insertId,
            album_id: albumId,
            title,
            url,
            thumbnail_url: thumbnailUrl || null,
        });
    });
};

const updatePhoto = (req, res) => {
    const { id } = req.params;
    const { albumId, title, url, thumbnailUrl } = req.body;

    if (!albumId || !title || !url) {
        return res.status(400).json({
            message: "albumId, title and url are required",
        });
    }

    const sql = `
    UPDATE photos
    SET title = ?, url = ?, thumbnail_url = ?
    WHERE id = ? AND album_id = ?
  `;

    db.query(
        sql,
        [title, url, thumbnailUrl || null, id, albumId],
        (err, result) => {
            if (err)
                return res.status(500).json({ message: "Server error" });

            if (result.affectedRows === 0) {
                return res
                    .status(404)
                    .json({ message: "Photo not found or not in this album" });
            }

            res.json({
                message: "Photo updated successfully",
            });
        }
    );
};

const patchPhoto = (req, res) => {
    const { id } = req.params;
    const { albumId, ...fields } = req.body;

    if (!albumId) {
        return res.status(400).json({
            message: "albumId is required",
        });
    }

    const allowedFields = [
        "title",
        "url",
        "thumbnail_url",
        "thumbnailUrl",
    ];

    const updates = [];
    const values = [];

    for (const key in fields) {
        if (allowedFields.includes(key)) {
            const column =
                key === "thumbnailUrl" ? "thumbnail_url" : key;

            updates.push(`${column} = ?`);
            values.push(fields[key]);
        }
    }

    if (updates.length === 0) {
        return res.status(400).json({
            message: "No valid fields to update",
        });
    }

    values.push(id);
    values.push(albumId);

    const sql = `
    UPDATE photos
    SET ${updates.join(", ")}
    WHERE id = ? AND album_id = ?
  `;

    db.query(sql, values, (err, result) => {
        if (err)
            return res.status(500).json({
                message: "Server error",
            });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Photo not found or not in this album",
            });
        }

        res.json({
            message: "Photo updated successfully",
        });
    });
};

const deletePhoto = (req, res) => {
    const { id } = req.params;
    const { albumId } = req.body;

    if (!albumId) {
        return res.status(400).json({
            message: "albumId is required",
        });
    }

    const sql = `
    DELETE FROM photos
    WHERE id = ? AND album_id = ?
  `;

    db.query(sql, [id, albumId], (err, result) => {
        if (err)
            return res.status(500).json({
                message: "Server error",
            });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Photo not found or not in this album",
            });
        }

        res.json({
            message: "Photo deleted successfully",
        });
    });
};

module.exports = {
    getPhotos,
    createPhoto,
    updatePhoto,
    patchPhoto,
    deletePhoto,
};