const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authenticateUser = require('../middleware/authMiddleware')
// Create a new employee
router.post('/',authenticateUser(),employeeController.createEmployee);

// Get all employees
router.get('/', employeeController.getAllEmployees);

// Update an employee by UUID
router.put('/:id', employeeController.updateEmployee);

// Delete an employee by UUID
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;          
