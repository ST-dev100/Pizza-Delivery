const express = require('express');
const {
  signupSuperAdmin,
  signupUser,
  signupNormalUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  logoutUser
} = require('../controllers/userController'); 
const router = express.Router(); 

router.post('/signup/super-admin', signupSuperAdmin);
router.post('/signup/user', signupUser);
router.post('/signup/normal', signupNormalUser);

// Login and logout routes
router.post('/login', loginUser);
router.post('/logout', logoutUser); 

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;        
