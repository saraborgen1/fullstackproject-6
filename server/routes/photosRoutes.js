const express = require("express");
const router = express.Router();

const {
    getPhotos,
    createPhoto,
    updatePhoto,
    patchPhoto,
    deletePhoto,
} = require("../controllers/photosController");

router.get("/", getPhotos);
router.post("/", createPhoto);
router.put("/:id", updatePhoto);
router.patch("/:id", patchPhoto);
router.delete("/:id", deletePhoto);

module.exports = router;