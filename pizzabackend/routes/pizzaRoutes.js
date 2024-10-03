const express = require('express');
const router = express.Router();
const pizzaController = require('../controllers/pizzaController');
const authenticateUser = require('../middleware/authMiddleware')

// POST route to create a pizza
router.post('/create',authenticateUser(), pizzaController.createPizza);

module.exports = router;
 