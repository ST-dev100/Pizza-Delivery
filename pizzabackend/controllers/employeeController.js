const db = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup
 // Adjust this import to match your database configuration
 const bcrypt = require('bcryptjs');

// Create a new employee
exports.createEmployee = async (req, res) => {
    const { name, phone_number, email, rolename, password,role_id} = req.body;  
    try { 
        let createdBy = null;

    //   // Check if the user is a 'super-admin' in the users table by uuid
    const userResult = await db.query(
        `SELECT uuid FROM public.users WHERE uuid = $1 AND rolename = 'super-admin'`,
        [req.user.id]
      );

        if (userResult.rows.length > 0) {
            // If email is found in users table with role 'super-admin', use it for createdBy
            createdBy = userResult.rows[0].uuid;
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await db.query(
                `INSERT INTO public.employees (name, phone_number, email, rolename, password, createdby, role_id)
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
                `SELECT createdby FROM public.employees WHERE uuid = $1`,
                [req.user.id]
            );

            if (employeeResult.rows.length > 0) { 
                // If found in employees, get the createdBy value from the found employee
                createdBy = employeeResult.rows[0].createdby;
                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await db.query(
                    `INSERT INTO public.employees (name, phone_number, email, rolename, password, createdby, role_id)
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


// Get all employees created by the current user
exports.getAllEmployees = async (req, res) => {
    try {
      console.log(req.user);
      
      // Step 1: First attempt to retrieve employees created by req.user.id
      let result = await db.query(
        `SELECT * FROM public.employees WHERE createdby = $1`,
        [req.user.id]
      );
  
      // Step 2: If no employees are found, search for req.user.id in the employees table
      if (result.rows.length === 0) {
        const employeeResult = await db.query(
          `SELECT createdby FROM public.employees WHERE uuid = $1`,
          [req.user.id]
        );
  
        // If req.user.id is found in employees table, get the createdby field
        if (employeeResult.rows.length > 0) {
          const createdBy = employeeResult.rows[0].createdby;
  
          // Step 3: Fetch all employees where createdby is the retrieved value
          result = await db.query(
            `SELECT * FROM public.employees WHERE createdby = $1`,
            [createdBy]
          );
  
          // If still no employees found, return an appropriate message
          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No employees found for this user' });
          }
        } else {
          return res.status(404).json({ message: 'User not found in employees table' });
        }
      }
  
      // Step 4: Return the found employees
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
    console.log("Update request body:", req.body);

    try {
        // Step 1: Attempt to update the employee's active status
        let result = await db.query(
            `UPDATE public.employees
             SET active = $1,
                 updatedat = CURRENT_TIMESTAMP
             WHERE uuid = $2 AND createdby = $3 RETURNING *`,
            [active, id, req.user.id]
        );

        // Step 2: If no employee was updated, check the employees table for createdby field
        if (result.rowCount === 0) {
            const employeeResult = await db.query(
                `SELECT createdby FROM public.employees WHERE uuid = $1`,
                [req.user.id]
            );

            // Step 3: If a createdby field is found, use it to attempt the update again
            if (employeeResult.rows.length > 0) {
                const createdBy = employeeResult.rows[0].createdby;

                result = await db.query(
                    `UPDATE public.employees
                     SET active = $1,
                         updatedat = CURRENT_TIMESTAMP
                     WHERE uuid = $2 AND createdby = $3 RETURNING *`,
                    [active, id, createdBy]
                );

                // Step 4: If still no employee was updated, return a not found message
                if (result.rowCount === 0) {
                    return res.status(404).json({ error: "Employee not found or not created by the user or their creator" });
                }
            } else {
                // If no createdby field is found, return a not found message
                return res.status(404).json({ error: "User not found in employees table" });
            }
        }

        // Step 5: Return success message if the employee's active status was successfully updated
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
    console.log("Attempting to delete employee with ID:", id);

    try {
        // Step 1: Attempt to delete the employee directly
        let result = await db.query(
            `DELETE FROM public.employees 
             WHERE uuid = $1 AND createdby = $2`,
            [id, req.user.id]
        );

        // Step 2: If no employee was deleted, check the employees table for createdby field
        if (result.rowCount === 0) {
            const employeeResult = await db.query(
                `SELECT createdby FROM public.employees WHERE uuid = $1`,
                [req.user.id]
            );

            // Step 3: If a createdby field is found, use it to attempt the deletion again
            if (employeeResult.rows.length > 0) {
                const createdBy = employeeResult.rows[0].createdby;

                result = await db.query(
                    `DELETE FROM public.employees 
                     WHERE uuid = $1 AND createdby = $2`,
                    [id, createdBy]
                );

                // Step 4: If still no employee was deleted, return a not found message
                if (result.rowCount === 0) {
                    return res.status(404).json({ error: "Employee not found or not created by the user or their creator" });
                }
            } else {
                // If no createdby field is found, return a not found message
                return res.status(404).json({ error: "User not found in employees table" });
            }
        }

        // Step 5: Return success message if the employee was successfully deleted
        res.status(204).json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error.message);
        res.status(500).json({ error: "Failed to delete employee" });
    }
};

