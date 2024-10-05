const express = require('express');
const router = express.Router();
const pizzaController = require('../controllers/pizzaController');
const authenticateUser = require('../middleware/authMiddleware');

// POST route to create a pizza
router.post('/create', authenticateUser(), pizzaController.createPizza);

// GET route to retrieve all pizzas
router.get('/', pizzaController.getAllPizzas); // Fetch all pizzas

// GET route to retrieve a pizza by ID
router.get('/:id',authenticateUser(), pizzaController.getPizzaById); // Fetch pizza by ID

module.exports = router;
  