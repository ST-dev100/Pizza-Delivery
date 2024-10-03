const express = require('express');
const {
  signupSuperAdmin,
  signupUser,
  signupNormalUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController'); 
const router = express.Router(); 

router.post('/signup/super-admin', signupSuperAdmin);
router.post('/signup/user', signupUser);
router.post('/signup/normal', signupNormalUser);
router.post('/login', loginUser);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;        
