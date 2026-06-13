import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tasks';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });

// Schema definitions
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
});

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'other'],
    required: true,
    default: 'other',
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  }
});

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dailyCalorieTarget: {
    type: Number,
    required: true,
    default: 500,
  },
  dailyDurationTarget: {
    type: Number,
    required: true,
    default: 45,
  },
  weeklyWorkoutsTarget: {
    type: Number,
    required: true,
    default: 4,
  }
});

const User = mongoose.model('User', userSchema);
const Workout = mongoose.model('Workout', workoutSchema);
const Goal = mongoose.model('Goal', goalSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'fitpulse_jwt_secret_key_12345';

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// API Routes

// Auth Routes
// POST: Register a new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const normalizedUsername = username.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({ username: normalizedUsername, password: hashedPassword });
    await newUser.save();

    // Create a default Goal document for the new user
    const newGoal = new Goal({ user: newUser._id });
    await newGoal.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST: Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const normalizedUsername = username.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET: Retrieve user's workouts
app.get('/api/workouts', authMiddleware, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// POST: Log a new workout for user
app.post('/api/workouts', authMiddleware, async (req, res) => {
  try {
    const { title, type, duration, calories, date, notes } = req.body;
    if (!title || !duration || calories === undefined) {
      return res.status(400).json({ error: 'Title, duration and calories are required' });
    }
    const newWorkout = new Workout({ 
      user: req.user.id,
      title, 
      type, 
      duration, 
      calories, 
      date, 
      notes 
    });
    await newWorkout.save();
    res.status(201).json(newWorkout);
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// PATCH: Update a workout log
app.patch('/api/workouts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, duration, calories, date, notes } = req.body;
    
    const updatedWorkout = await Workout.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { title, type, duration, calories, date, notes },
      { new: true, runValidators: true }
    );

    if (!updatedWorkout) {
      return res.status(404).json({ error: 'Workout not found or unauthorized' });
    }

    res.json(updatedWorkout);
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// DELETE: Remove a workout log
app.delete('/api/workouts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedWorkout = await Workout.findOneAndDelete({ _id: id, user: req.user.id });
    
    if (!deletedWorkout) {
      return res.status(404).json({ error: 'Workout not found or unauthorized' });
    }

    res.json({ message: 'Workout deleted successfully', id });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// GET: Fetch targets/goals for user
app.get('/api/goals', authMiddleware, async (req, res) => {
  try {
    let goal = await Goal.findOne({ user: req.user.id });
    if (!goal) {
      goal = new Goal({ user: req.user.id });
      await goal.save();
    }
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// PUT: Update targets/goals for user
app.put('/api/goals', authMiddleware, async (req, res) => {
  try {
    const { dailyCalorieTarget, dailyDurationTarget, weeklyWorkoutsTarget } = req.body;
    let goal = await Goal.findOne({ user: req.user.id });
    if (!goal) {
      goal = new Goal({ 
        user: req.user.id,
        dailyCalorieTarget, 
        dailyDurationTarget, 
        weeklyWorkoutsTarget 
      });
    } else {
      if (dailyCalorieTarget !== undefined) goal.dailyCalorieTarget = dailyCalorieTarget;
      if (dailyDurationTarget !== undefined) goal.dailyDurationTarget = dailyDurationTarget;
      if (weeklyWorkoutsTarget !== undefined) goal.weeklyWorkoutsTarget = weeklyWorkoutsTarget;
    }
    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Error updating goals:', error);
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

// Server Start
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful Shutdown
const handleGracefulShutdown = () => {
  console.log('Received shutdown signal. Closing resources...');
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', handleGracefulShutdown);
process.on('SIGTERM', handleGracefulShutdown);
