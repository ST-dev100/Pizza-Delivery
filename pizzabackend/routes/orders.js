 // routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController'); // Import the controller
const authenticateUser = require('../middleware/authMiddleware');

// Create a new order
router.post('/',authenticateUser(), orderController.createOrder);    

// Get all orders
router.get('/', authenticateUser(),orderController.getAllOrders);
 
// Get order by ID
router.get('/:id', orderController.getOrderById);  

// Update an    
router.put('/:id',authenticateUser(), orderController.updateOrder);

// Delete an order
router.delete('/:id',authenticateUser(), orderController.deleteOrder);

router.put('/order/:id/status',authenticateUser(),orderController.updateOrderStatus)
module.exports = router; 
