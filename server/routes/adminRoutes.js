const express = require("express");
const router = express.Router();

const {
    getStatistics,
    getAllUsersForAdmin,
    updateAdminStatus,
} = require("../controllers/adminController");

router.get("/statistics", getStatistics);
router.get("/users", getAllUsersForAdmin);
router.patch("/users/:id/admin", updateAdminStatus);

module.exports = router;