const express = require("express");
const router = express.Router();

const {
    getAlbums,
    createAlbum,
    updateAlbum,
    patchAlbum,
    deleteAlbum
} = require("../controllers/albumsController");

router.get("/", getAlbums);
router.post("/", createAlbum);
router.put("/:id", updateAlbum);
router.patch("/:id", patchAlbum);
router.delete("/:id", deleteAlbum);

module.exports = router;