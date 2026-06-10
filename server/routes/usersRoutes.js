const express = require("express");
const router = express.Router();

const {
    getUserById,
    updateUser,
    deleteUser,
    patchUser,
} = require("../controllers/usersController");

router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id", patchUser);

module.exports = router;