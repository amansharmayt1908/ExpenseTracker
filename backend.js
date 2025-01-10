const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Add session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Connect to MongoDB
mongoose.connect('mongodb+srv://amansharmayt19:nvrQpvCAPAWSEh9C@scripterx.7nhap.mongodb.net/ExpenseTracker?retryWrites=true&w=majority&appName=ScripterX', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to ExpenseTracker database"))
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: Number
}, { collection: 'users' });

const addExpenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: Date,
    reason: String,
    amount: Number
}, { collection: 'expenses' });

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', addExpenseSchema);

// Add expense endpoint
app.post('/addExpense', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const { date, reason, amount } = req.body;
        if (!date || !reason || !amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const expense = new Expense({ 
            userId: req.session.userId,
            date: date, 
            reason: reason, 
            amount: amount
        });
        await expense.save();
        res.json({ message: 'Data saved successfully!' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get expenses endpoint
app.get('/getExpenses', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const expenses = await Expense.find({ userId: req.session.userId })
            .sort({ date: -1 })
            .limit(10);
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete expense endpoint
app.delete('/deleteExpense/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid expense ID' });
        }

        const result = await Expense.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });
        if (!result) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint
app.post('/verifyuser', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find user in database
        const user = await User.findOne({ username: username });
        
        if (!user) {
            res.json({ found: false });
            return;
        }

        // Compare password directly since it's stored as a number
        if (user.password !== Number(password)) {
            res.json({ found: false });
            return;
        }

        // Store user ID in session
        req.session.userId = user._id;

        // Redirect to main page on successful login
        res.json({ success: true, redirect: '/Expense-Tracker' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/Expense-Tracker', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Error during logout' });
        }
        res.json({ success: true });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
