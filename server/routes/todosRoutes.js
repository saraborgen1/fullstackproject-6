const express = require("express");
const router = express.Router();

const {
    getTodos,
    createTodo,
    patchTodo,
    deleteTodo,
    updateTodo,
} = require("../controllers/todosController");

router.get("/", getTodos);
router.post("/", createTodo);
router.patch("/:id", patchTodo);
router.delete("/:id", deleteTodo);
router.put("/:id", updateTodo);

module.exports = router;