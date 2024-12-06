const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/employee.js');
const jwt = require('jsonwebtoken');
const SECRET_KEY = '${process.env.ACCESS_TOKEN_SECRET}';
const bodyParser = require('body-parser');
const AC = require('./models/AC');
const maintenanceEvent = require('./models/maintenanceEvent.js');
const router = express.Router();
const { authenticateToken, authRole } = require('./Middleware/authenticateToken.js')

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Dashboard Route (Protected)
app.get('/dashboard', authenticateToken, (req, res) => {
    res.json({
        message: `Welcome to your dashboard, ${req.user.username}`,
        userId: req.user.id, // Include user ID
    });
});

app.get('/adminpanel', authenticateToken, authRole('admin'), (req, res) => {
    res.json({
        message: `Welcome to the admin panel, ${req.user.username}!`,
    });
});

// Register Route (Create a User)
app.post('/users', async (req, res) => {
    const { firstname, lastname, age, birthdate, email, username, password } = req.body;

    try {
        const user = new User({ firstname, lastname, age, birthdate, email, username, password });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: 'Validation Error', details: errors });
        }
        res.status(400).json({ error: 'Error creating user', details: err.message });
    }
});

app.get('/users', async (req, res) => {
    try {
        const getUser = await User.find();
        res.status(200).send(getUser);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch users' });
    }
});


// get user by id
app.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).send({ error: 'User not found' });
        }

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch User' });
    }
});

// Update user
app.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true, // Return the updated document
            runValidators: true, // Validate the updates against the schema
        });

        if (!updatedUser) {
            return res.status(404).send({ error: 'User not found' });
        }

        res.status(200).send(updatedUser);
    } catch (error) {
        res.status(400).send({ error: 'Failed to update user' });
    }
})

// Delete user
app.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const deleteUser = await User.findByIdAndDelete(userId);

        if (!deleteUser) {
            return res.status(404).json({ success: false, message: "Event not found." });
        }

        res.status(200).json({ success: true, message: "user deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
})

// Login Route
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body; // Use `username` for both email or username input.

    try {
        // Match either email or username based on the provided `username` field.
        const user = await User.findOne({
            $or: [{ email: username }, { username }],
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email/username or password' });
        }

        // Check if the passwords match (without hashing for now).
        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid email/username or password' });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        // Respond with the token and other optional info (e.g., userId)
        return res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id, // Include user ID in the response
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error logging in', details: err.message });
    }
});

// Add new ac
app.post('/api/ac', async (req, res) => {
    const ac = new AC(req.body);
    await ac.save();
    res.status(201).send(ac);
});

// get all AC
app.get('/api/ac', async (req, res) => {
    const acUnits = await AC.find();
    res.send(acUnits);
});

// get Ac by id
app.get('/api/ac/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        // Find the AC unit by custom string 'id'
        const acUnit = await AC.findById(id);

        if (!acUnit) {
            return res.status(404).json({ success: false, message: "AC unit not found." });
        }

        res.status(200).json({ success: true, data: acUnit });
    } catch (error) {
        console.error("Error fetching AC unit:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Update AC
app.put('/api/ac/:id', async (req, res) => {
    try {
        const updatedAC = await AC.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAC) return res.status(404).send({ message: 'AC not found' });
        res.send(updatedAC);
    } catch (err) {
        res.status(500).send({ message: 'Error updating AC', error: err });
    }
});

// Delete AC
app.delete('/api/ac/:id', async (req, res) => {
    try {
        const deletedAC = await AC.findByIdAndDelete(req.params.id);
        if (!deletedAC) return res.status(404).send({ message: 'AC not found' });
        res.send(deletedAC);
    } catch (err) {
        res.status(500).send({ message: 'Error deleting AC', error: err });
    }
});


// Patch for updating
app.patch('/api/ac/:id', async (req, res) => {
    const { id } = req.params;
    const { date, description, employee } = req.body;

    console.log(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid AC unit ID." });
    }

    console.log(req.params.id); // Debug log
    // Your update logic here

    try {
        // Validate if ID is a MongoDB ObjectId or use 'id' field
        const query = mongoose.Types.ObjectId.isValid(id)
            ? { _id: id } // Search by MongoDB _id
            : { id };     // Search by custom id

        const updatedACUnit = await AC.findOneAndUpdate(
            query,
            { $push: { maintenanceHistory: { date, description, employee } } },
            { new: true, runValidators: true }
        );

        if (!updatedACUnit) {
            return res.status(404).json({ success: false, message: "AC unit not found." });
        }

        res.status(200).json({ success: true, updatedACUnit });
    } catch (error) {
        console.error('Error updating maintenance history:', error);
        res.status(500).json({ success: false, message: "Server Error." });
    }
});

// Add new Maintenance Event
app.post('/api/maintenance', async (req, res) => {
    try {
        const { title, date, tasks, details } = req.body;

        // Validate required fields
        if (!title || !date || !tasks || !details) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { acID, assignedEmployees, timeStart, timeEnd, status, summary } = details;

        // Validate details fields
        if (!acID || !assignedEmployees || !Array.isArray(assignedEmployees)) {
            return res.status(400).json({ error: 'Details field is incomplete or missing required data' });
        }

        // Map assigned employee IDs to ObjectId and validate against the database
        const employeeObjectIds = assignedEmployees.map(id => new mongoose.Types.ObjectId(id));
        const validEmployees = await User.find({ _id: { $in: employeeObjectIds } });
        if (validEmployees.length !== assignedEmployees.length) {
            return res.status(400).json({ error: 'One or more assigned employees are invalid' });
        }

        // Create a new maintenance event
        const maintenance = new maintenanceEvent({
            title,
            date,
            tasks,
            acID,
            assignedEmployee: validEmployees.map(emp => emp._id),
            details: {
                timeStart,
                timeEnd,
                status,
                summary,
            },
        });

        // Save to database
        const savedMaintenance = await maintenance.save();

        // Populate assignedEmployee details in the response
        const populatedMaintenance = await savedMaintenance.populate('assignedEmployee', 'firstname lastname');

        res.status(201).json(populatedMaintenance);
    } catch (error) {
        console.error('Error saving maintenance event:', error);
        res.status(500).json({ error: 'Failed to create maintenance event', details: error.message });
    }
});


app.put('/api/maintenance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid maintenance event ID' });
        }

        // Retrieve the maintenance event first
        const event = await maintenanceEvent.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Maintenance event not found' });
        }

        // Optional: Process assigned employees
        if (updateData.details && updateData.details.assignedEmployees) {
            const employeeObjectIds = updateData.details.assignedEmployees.map(
                (empId) => new mongoose.Types.ObjectId(empId)
            );

            const validEmployees = await User.find({ _id: { $in: employeeObjectIds } });

            if (validEmployees.length !== updateData.details.assignedEmployees.length) {
                return res.status(400).json({ error: 'One or more assigned employees are invalid' });
            }

            updateData.assignedEmployee = validEmployees.map((emp) => emp._id);
            delete updateData.details.assignedEmployees;
        }

        // Update the maintenance event with new fields
        const updatedMaintenance = await maintenanceEvent
            .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('assignedEmployee', 'firstname lastname');

        if (!updatedMaintenance) {
            return res.status(404).json({ error: 'Maintenance event not found' });
        }

        res.status(200).json(updatedMaintenance);
    } catch (error) {
        console.error('Error updating maintenance event:', error);
        res.status(500).json({ error: 'Failed to update maintenance event', details: error.message });
    }
});



/// Delete Maintenance Event
app.delete('/api/maintenance/:id', async (req, res) => {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid Event ID." });
    }

    try {
        // Attempt to delete the event
        const mEvent = await maintenanceEvent.findByIdAndDelete(id);

        // Check if the event exists
        if (!mEvent) {
            return res.status(404).json({ success: false, message: "Event not found." });
        }

        // Success response
        res.status(200).json({ success: true, message: "Event deleted successfully." });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
});

// Get by ID
app.get('/api/maintenance/:id', async (req, res) => {
    const { id } = req.params;

    // Validate the provided ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid maintenance event ID." });
    }

    try {
        // Find the maintenance event and populate necessary fields
        const maintenanceE = await maintenanceEvent.findById(id)
            .populate('acID', 'name location watts maintenanceHistory id') // Populate AC details
            .populate('assignedEmployee', 'firstname lastname') // Populate assigned employees (firstname and lastname)
            .exec();

        // Check if the event exists
        if (!maintenanceE) {
            return res.status(404).json({ success: false, message: "Maintenance event not found." });
        }

        // Success response with combined data
        res.status(200).json({
            success: true,
            data: {
                ...maintenanceE.toObject(), // Include the event details
                acDetails: {
                    name: maintenanceE.acID?.name || "N/A",
                    location: maintenanceE.acID?.location || "N/A",
                    watts: maintenanceE.acID?.watts || "N/A",
                    maintenanceHistory: maintenanceE.acID?.maintenanceHistory || [],
                },
                assignedEmployees: maintenanceE.assignedEmployee || [],
            },
        });
    } catch (error) {
        console.error("Error fetching maintenance event:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
});

// API route to fetch a maintenance event with populated data
app.get('/api/maintenance/:id', async (req, res) => {
    try {
        const maintenanceEvent = await MaintenanceEvent.findById(req.params.id)
            .populate('acID') // Populate AC details
            .populate('assignedEmployee'); // Populate Employee details

        if (!maintenanceEvent) {
            return res.status(404).json({ message: 'Maintenance event not found.' });
        }

        res.status(200).json(maintenanceEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching data.' });
    }
});

// Get all Maintenance Events
app.get('/api/maintenance', async (req, res) => {
    try {
        const maintenance = await maintenanceEvent.find(); // Populate employee details

        res.status(200).json(maintenance); // Send populated data
    } catch (error) {
        console.error('Error fetching maintenance events:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance events' });
    }
});


app.get('/api/maintenance/by-ac/:acID', async (req, res) => {
    try {
        const { acID } = req.params;

        if (!acID) {
            return res.status(400).json({ error: 'acID is required' });
        }

        const maintenanceEvents = await maintenanceEvent.find({ acID }).populate('assignedEmployee', 'firstname lastname');
        res.status(200).json(maintenanceEvents);
    } catch (error) {
        console.error('Error fetching maintenance events by acID:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance events', details: error.message });
    }
});


router.get('/api/maintenance/:acID', async (req, res) => {
    try {
        const { acID } = req.params;
        const records = await Maintenance.find({ acID }).populate('assignedEmployee').exec(); // Fetch and populate assignedEmployee references
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching maintenance records', details: error.message });
    }
});

module.exports = router;

// Get AC details via Maintenance Event ID
app.get('/api/ac/maintenance/:eventId', async (req, res) => {
    const { eventId } = req.params;

    try {
        // Find the maintenance event by its ID
        const getMaintenance = await maintenanceEvent.findById(eventId);

        if (!getMaintenance) {
            return res.status(404).json({ success: false, message: "Maintenance event not found." });
        }

        // Extract the acID from the maintenance event
        const { acID } = getMaintenance;

        // Fetch the AC details using the acID
        const acUnit = await AC.findById(acID);

        if (!acUnit) {
            return res.status(404).json({ success: false, message: "AC unit not found." });
        }

        res.status(200).json({ success: true, data: acUnit });
    } catch (error) {
        console.error("Error fetching AC details from maintenance event:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});


app.get('/api/employee-statistics', async (req, res) => {
    const { userId } = req.query; // Get the userId from query params

    try {
        // Fetch all maintenance events
        const maintenanceEvents = userId
            ? await maintenanceEvent.find({ 'assignedEmployee': userId }).populate('assignedEmployee', 'firstname lastname')
            : await maintenanceEvent.find().populate('assignedEmployee', 'firstname lastname');

        if (!maintenanceEvents || maintenanceEvents.length === 0) {
            return res.status(404).json({ error: userId ? 'No maintenance events found for this user' : 'No maintenance events found' });
        }

        // Initialize a map to track statistics per employee
        const statisticsMap = {};

        maintenanceEvents.forEach(event => {
            const tasks = event.tasks;

            event.assignedEmployee.forEach(employee => {
                const employeeId = employee._id.toString();

                // If the employee isn't in the map, initialize their data
                if (!statisticsMap[employeeId]) {
                    statisticsMap[employeeId] = {
                        _id: employeeId,
                        name: `${employee.firstname} ${employee.lastname}`,
                        totalMaintenance: 0,
                        taskCounts: {},
                    };
                }

                // Increment maintenance count
                statisticsMap[employeeId].totalMaintenance += 1;

                // Count tasks
                tasks.forEach(task => {
                    if (!statisticsMap[employeeId].taskCounts[task]) {
                        statisticsMap[employeeId].taskCounts[task] = 0;
                    }
                    statisticsMap[employeeId].taskCounts[task] += 1;
                });
            });
        });

        // Convert map to an array and sort by totalMaintenance in descending order
        const statistics = Object.values(statisticsMap);
        statistics.sort((a, b) => b.totalMaintenance - a.totalMaintenance);

        res.status(200).json(statistics);
    } catch (error) {
        console.error('Error fetching employee statistics:', error.message);
        res.status(500).json({ error: 'Failed to fetch employee statistics', details: error.message });
    }
});

// Get AC Maintenance History
app.get('/api/ac/:acID/history', async (req, res) => {
    try {
        const { acID } = req.params;
        const acUnit = await AC.findById(acID);
        if (!acUnit) {
            return res.status(404).json({ error: 'AC unit not found' });
        }
        res.status(200).json(acUnit.maintenanceHistory);
    } catch (error) {
        console.error('Error fetching maintenance history:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance history' });
    }
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
