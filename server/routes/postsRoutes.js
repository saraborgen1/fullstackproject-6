const express = require("express");
const router = express.Router();

const {
    getPosts,
    createPost,
    updatePost,
    patchPost,
    deletePost,
} = require("../controllers/postsController");

router.get("/", getPosts);
router.post("/", createPost);
router.put("/:id", updatePost);
router.patch("/:id", patchPost);
router.delete("/:id", deletePost);

module.exports = router;