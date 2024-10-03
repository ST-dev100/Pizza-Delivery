const db = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup
 // Adjust this import to match your database configuration
 const bcrypt = require('bcryptjs');

// Create a new employee
exports.createEmployee = async (req, res) => {
    const { name, phone_number, email, rolename, password,role_id} = req.body;  
    try { 
        let createdBy = null;

    //     // First, check if the email exists in the users table with the role 'super-admin'
        const userResult = await db.query(
            `SELECT email FROM public.users WHERE email = $1 AND rolename = 'super-admin'`,
            [req.user.email]
        );

        if (userResult.rows.length > 0) {
            // If email is found in users table with role 'super-admin', use it for createdBy
            createdBy = userResult.rows[0].email;
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await db.query(
                `INSERT INTO public.employees (name, phone_number, email, rolename, password, createdBy, role_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [name, phone_number, email, rolename, hashedPassword, createdBy, role_id]
              );
    
            return res.status(201).json({
                message: "Employee created successfully",
                employee: result.rows[0], 
            });
        } 
        else {
    //         // If not in users, check the employees table for the email
            const employeeResult = await db.query(
                `SELECT createdBy FROM public.employees WHERE email = $1`,
                [req.user.email]
            );

            if (employeeResult.rows.length > 0) {
                // If found in employees, get the createdBy value from the found employee
                createdBy = employeeResult.rows[0].createdBy;
                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await db.query(
                    `INSERT INTO public.employees (name, phone_number, email, rolename, password, createdBy, role_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                    [name, phone_number, email, rolename, hashedPassword, createdBy, role_id]
                  );
            } else {
                // If the email is not found in either table, return an error
                return res.status(404).json({
                    message: "Email not found in users or employees tables",
                });
            }
        }

    //     // Proceed to create the new employee using the found createdBy
        
    } catch (error) {
        console.error("Error creating employee:", error.message);
        res.status(500).json({ error: "Failed to create employee" });
    }
};


// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        console.log(req.user)
        const result = await db.query(`SELECT * FROM public.employees`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching employees:", error.message);
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};  

// Update the 'active' status of an employee
exports.updateEmployee = async (req, res) => {
    const { id } = req.params; // Assuming id is the UUID
    const { active } = req.body; // Expecting only 'active' in the request body
    console.log(req.body)
    try {
        const result = await db.query(
            `UPDATE public.employees
            SET active = $1,
            updatedAt = CURRENT_TIMESTAMP
            WHERE uuid = $2 RETURNING *`,
            [active, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.status(200).json({
            message: "Employee 'active' status updated successfully",
            employee: result.rows[0],
        });   
    } catch (error) {
        console.error("Error updating employee:", error.message);
        res.status(500).json({ error: "Failed to update employee's active status" });
    }
};


// Delete an employee
exports.deleteEmployee = async (req, res) => {
    const { id } = req.params; // Assuming id is the UUID
    try {
        const result = await db.query(`DELETE FROM public.employees WHERE uuid = $1`, [id]);
        console.log(result)
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.status(204).json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error.message);
        res.status(500).json({ error: "Failed to delete employee" });
    }
};
