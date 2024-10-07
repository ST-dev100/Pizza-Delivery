// controllers/orderController.js
const pool = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup


// Create a new order
const createOrder = async (req, res) => { 
  console.log("create order",req.user)
  console.log("create order",req.body)
  const { name, topping, quantity,  pizza_id } = req.body;
  // // name:data?.pizza_name, topping:checkedToppings, quantity,pizza_id:id
  try {
    const userResult = await pool.query(
      'SELECT phone_number FROM users WHERE uuid = $1',
      [req.user.id]
    );
      
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer_phone_number = userResult.rows[0].phone_number;
    const result = await pool.query(
      'INSERT INTO orders (name, topping, quantity, customer_phone_number, user_id, pizza_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, topping, quantity, customer_phone_number, req.user.id, pizza_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user's ID from the request

    // Step 1: Retrieve all pizza_ids from orders
    let pizzasResult = await pool.query(`
      SELECT o.* 
      FROM orders o 
      JOIN pizza p ON o.pizza_id = p.uuid 
      WHERE p.createdby = $1
    `, [userId]);

    // Step 2: If no orders found, search for req.user.id in the employees table
    if (pizzasResult.rows.length === 0) {
      const employeesResult = await pool.query(`
        SELECT createdby 
        FROM employees 
        WHERE uuid = $1
      `, [userId]);

      if (employeesResult.rows.length > 0) {
        const createdBy = employeesResult.rows[0].createdby;

        // Step 3: Query orders again using createdby from employees table
        pizzasResult = await pool.query(`
          SELECT o.* 
          FROM orders o 
          JOIN pizza p ON o.pizza_id = p.uuid 
          WHERE p.createdby = $1
        `, [createdBy]);

        if (pizzasResult.rows.length === 0) {
          return res.status(404).json({ message: 'No orders found for pizzas created by this employee' });
        }
      } else {
        return res.status(404).json({ message: 'User not found in employees table' });
      }
    }

    // Return orders where pizza_id's creator matches req.user.id or employee's createdby field
    res.status(200).json(pizzasResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};



// Get order by ID
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE uuid = $1', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update an order
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { name, topping, quantity, customer_phone_number, user_id, pizza_id } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET name = $1, topping = $2, quantity = $3, customer_phone_number = $4, user_id = $5, pizza_id = $6, updated_at = CURRENT_TIMESTAMP WHERE uuid = $7 RETURNING *',
      [name, topping, quantity, customer_phone_number, user_id, pizza_id, id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE uuid = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;  // Order UUID from the URL
  const { status } = req.body;  // New status from the request body

  // Validate that the status is one of the allowed values
  const allowedStatuses = ['Delivered', 'Preparing', 'Ready'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    // Update the status of the order with the given ID
    const query = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE uuid = $2 RETURNING *';
    const values = [status, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus
};
