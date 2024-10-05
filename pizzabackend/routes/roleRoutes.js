// roleRoutes.js
const express = require("express");
const router = express.Router();
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRoleById,
  deleteRoleById,
  updateRoleActiveStatus
} = require("../controllers/roleController");
const authenticateUser = require('../middleware/authMiddleware')


// Route to create a new role
router.post("/roles",authenticateUser(), createRole);

// Route to get all roles
router.get("/roles",authenticateUser(), getAllRoles);      

// Route to get a role by UUID
router.get("/roles/:id", authenticateUser(),getRoleById);

// Route to update a role by UUID 
router.put("/roles/:id", authenticateUser(),updateRoleById); 

router.patch('/roles/:id/active', authenticateUser(),updateRoleActiveStatus);
// Route to delete a role by UUID
router.delete("/roles/:id", authenticateUser(),deleteRoleById);

module.exports = router;
