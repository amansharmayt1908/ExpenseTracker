const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');


const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Connect to MongoDB
mongoose.connect('mongodb+srv://amansharmayt19:nvrQpvCAPAWSEh9C@scripterx.7nhap.mongodb.net/ExpenseTracker?retryWrites=true&w=majority&appName=ScripterX', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to ExpenseTracker database"))
.catch(err => console.log(err));

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: Number
}, { collection: 'users' });

const addExpenseSchema = new mongoose.Schema({
    date : Date,
    reason : String,
    amount : Number
}, { collection: 'expenses' });

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', addExpenseSchema);

// Add expense endpoint
app.post('/addExpense', async (req, res) => {
    try {
        const { date, reason, amount } = req.body;
        const expense = new Expense({ 
            date : date, reason : reason, amount : amount});
        await expense.save();
        res.json({ message: 'Data saved successfully!' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get expenses endpoint
app.get('/getExpenses', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 }).limit(10);
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete expense endpoint
app.delete('/deleteExpense/:id', async (req, res) => {
    try {
        const result = await Expense.findByIdAndDelete(req.params.id);
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
        // Find user in database
        const user = await User.findOne({ username : username });
        
        if (!user) {
            res.json({ found: false });
            return;
        }

        // Compare password directly since it's stored as a number
        if (user.password !== Number(password)) {
            res.json({ found: false });
            return;
        }

        // Redirect to main page on successful login
        res.json({ success: true, redirect: '/Expense-Tracker' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Serve main.html
app.get('/Expense-Tracker', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
