// controllers/orderController.js
const pool = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup


// Create a new order
const createOrder = async (req, res) => { 
  const { name, topping, quantity, customer_phone_number, user_id, pizza_id } = req.body;

  try {
    
    const result = await pool.query(
      'INSERT INTO orders (name, topping, quantity, customer_phone_number, user_id, pizza_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, topping, quantity, customer_phone_number, user_id, pizza_id]
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
    const result = await pool.query('SELECT * FROM orders');
    res.status(200).json(result.rows);
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

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
