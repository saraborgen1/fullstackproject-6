const express = require("express");
const router = express.Router();

const {
    getUserById,
    updateUser,
    deleteUser,
    patchUser,
    blockUser,
    changePassword,
    getUserDashboard,
} = require("../controllers/usersController");

router.get("/:id/dashboard", getUserDashboard);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/block", blockUser);
router.patch("/:id/change-password", changePassword);
router.patch("/:id", patchUser);

module.exports = router;