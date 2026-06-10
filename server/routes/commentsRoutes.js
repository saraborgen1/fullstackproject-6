const express = require("express");
const router = express.Router();

const {
  getComments,
  createComment,
  updateComment,
  patchComment,
  deleteComment
} = require("../controllers/commentsController");

router.get("/", getComments);
router.post("/", createComment);
router.put("/:id", updateComment);
router.patch("/:id", patchComment);
router.delete("/:id", deleteComment);

module.exports = router;