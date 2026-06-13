import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Clock, 
  Flame, 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  Target, 
  Calendar, 
  Heart,
  Loader2,
  Sparkles,
  Settings,
  X,
  Lock,
  User,
  LogIn,
  UserPlus,
  LogOut
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('fitpulse_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fitpulse_user') || 'null'));
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'signup'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // App States
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState({
    dailyCalorieTarget: 500,
    dailyDurationTarget: 45,
    weeklyWorkoutsTarget: 4
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [goalCal, setGoalCal] = useState(500);
  const [goalDur, setGoalDur] = useState(45);
  const [goalWeek, setGoalWeek] = useState(4);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('cardio');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tab state
  const [activeTab, setActiveTab] = useState('all');

  // Trigger fetch when token is available
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleUnauthorized = () => {
    localStorage.removeItem('fitpulse_token');
    localStorage.removeItem('fitpulse_user');
    setToken('');
    setUser(null);
    setWorkouts([]);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch workouts
      const workoutRes = await fetch(`${API_BASE}/api/workouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (workoutRes.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!workoutRes.ok) throw new Error('Failed to fetch workouts');
      const workoutData = await workoutRes.json();
      setWorkouts(workoutData);

      // Fetch goals
      const goalRes = await fetch(`${API_BASE}/api/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (goalRes.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!goalRes.ok) throw new Error('Failed to fetch goals');
      const goalData = await goalRes.json();
      setGoals(goalData);
      setGoalCal(goalData.dailyCalorieTarget);
      setGoalDur(goalData.dailyDurationTarget);
      setGoalWeek(goalData.weeklyWorkoutsTarget);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername.trim() || !authPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (authPage === 'signup' && authPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      setIsAuthLoading(true);
      const url = authPage === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save token and user details
      localStorage.setItem('fitpulse_token', data.token);
      localStorage.setItem('fitpulse_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      // Clear auth forms
      setAuthUsername('');
      setAuthPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Authentication connection error. Try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    handleUnauthorized();
  };

  const handleCreateWorkout = async (e) => {
    e.preventDefault();
    if (!title.trim() || !duration || !calories) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/api/workouts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title,
          type,
          duration: Number(duration),
          calories: Number(calories),
          date: new Date(date).toISOString(),
          notes
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) throw new Error('Failed to log workout');
      const newWorkout = await response.json();
      
      setWorkouts([newWorkout, ...workouts]);
      // Reset form (except date)
      setTitle('');
      setType('cardio');
      setDuration('');
      setCalories('');
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Error saving workout log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (!confirm('Are you sure you want to delete this workout log?')) return;

    const previousWorkouts = [...workouts];
    setWorkouts(workouts.filter(w => w._id !== id));

    try {
      const response = await fetch(`${API_BASE}/api/workouts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) throw new Error('Failed to delete workout');
    } catch (err) {
      console.error(err);
      setWorkouts(previousWorkouts);
      alert('Could not delete workout log. Reverting.');
    }
  };

  const handleUpdateGoals = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/goals`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dailyCalorieTarget: Number(goalCal),
          dailyDurationTarget: Number(goalDur),
          weeklyWorkoutsTarget: Number(goalWeek)
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) throw new Error('Failed to update goals');
      const updatedGoals = await response.json();
      setGoals(updatedGoals);
      setShowSettings(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update goals. Please try again.');
    }
  };

  // Helper calculations for metrics
  const todayStr = new Date().toISOString().split('T')[0];

  const getTodayWorkouts = () => {
    return workouts.filter(w => {
      const wDateStr = new Date(w.date).toISOString().split('T')[0];
      return wDateStr === todayStr;
    });
  };

  const todayWorkouts = getTodayWorkouts();
  const todayCalories = todayWorkouts.reduce((sum, w) => sum + w.calories, 0);
  const todayDuration = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);

  // Weekly workouts (last 7 days including today)
  const getWeeklyWorkouts = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return workouts.filter(w => new Date(w.date) >= oneWeekAgo);
  };
  const weeklyWorkouts = getWeeklyWorkouts();
  const weeklyCount = weeklyWorkouts.length;

  // Calculate Streak (consecutive active days)
  const calculateStreak = () => {
    if (workouts.length === 0) return 0;
    
    // Get unique active dates in descending order (local time)
    const activeDates = Array.from(new Set(
      workouts.map(w => new Date(w.date).toLocaleDateString())
    )).map(dStr => new Date(dStr)).sort((a, b) => b - a);

    if (activeDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const firstActiveDate = activeDates[0];
    firstActiveDate.setHours(0,0,0,0);

    if (firstActiveDate.getTime() !== today.getTime() && firstActiveDate.getTime() !== yesterday.getTime()) {
      return 0;
    }

    let expectedDate = new Date(firstActiveDate);

    for (let i = 0; i < activeDates.length; i++) {
      const currentDate = new Date(activeDates[i]);
      currentDate.setHours(0,0,0,0);
      const diffTime = expectedDate - currentDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        if (i === 0) streak = 1;
      } else if (diffDays === 1) {
        streak++;
        expectedDate = currentDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const streakCount = calculateStreak();

  // Generate 7 Days custom bar chart heights (last 7 days)
  const getLast7DaysData = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = weekdays[d.getDay()];
      
      // Calculate minutes logged on this day
      const dayWorkouts = workouts.filter(w => new Date(w.date).toISOString().split('T')[0] === dStr);
      const minutes = dayWorkouts.reduce((sum, w) => sum + w.duration, 0);
      const calories = dayWorkouts.reduce((sum, w) => sum + w.calories, 0);
      
      days.push({
        dateStr: dStr,
        dayLabel: i === 0 ? 'Today' : dayName,
        minutes,
        calories
      });
    }
    return days;
  };

  const chartData = getLast7DaysData();

  // Filter workouts list
  const filteredWorkouts = workouts.filter(w => {
    if (activeTab === 'all') return true;
    return w.type === activeTab;
  });

  const getWorkoutIcon = (type) => {
    switch (type) {
      case 'cardio':
        return <Flame size={20} className="icon-cardio" />;
      case 'strength':
        return <Dumbbell size={20} className="icon-strength" />;
      case 'flexibility':
        return <Heart size={20} className="icon-flexibility" />;
      default:
        return <Activity size={20} className="icon-other" />;
    }
  };

  const formatWorkoutDate = (dateVal) => {
    const d = new Date(dateVal);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // RENDER AUTHENTICATION VIEW IF NO VALID TOKEN EXISTS
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card glass-panel animate-fade-in">
          <div className="auth-logo">
            <div className="header-badge">
              <Sparkles size={16} />
              <span>FITPULSE TRACKER</span>
            </div>
            <h2>Fit<span className="text-gradient">Pulse</span></h2>
            <p>{authPage === 'login' ? 'Sign in to access your dashboard' : 'Create an account to start logging workouts'}</p>
          </div>

          {authError && (
            <div className="error-text">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="workout-form">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Username
              </label>
              <input 
                type="text" 
                placeholder="Enter your username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>

            {authPage === 'signup' && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} /> Confirm Password
                </label>
                <input 
                  type="password" 
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-primary w-full" style={{ marginTop: '10px' }} disabled={isAuthLoading}>
              {isAuthLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Working...
                </>
              ) : authPage === 'login' ? (
                <>
                  <LogIn size={18} /> Log In
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Sign Up
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            {authPage === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => {
                setAuthPage(authPage === 'login' ? 'signup' : 'login');
                setAuthError('');
                setAuthPassword('');
                setConfirmPassword('');
              }} 
              className="auth-toggle-btn"
            >
              {authPage === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // RENDER MAIN APPLICATION IF AUTHENTICATED
  return (
    <div className="container">
      {/* Premium Header */}
      <header className="main-header">
        <div>
          <div className="header-badge animate-fade-in">
            <Sparkles size={16} />
            <span>FITNESS COMPANION</span>
          </div>
          <h1>Fit<span className="text-gradient">Pulse</span></h1>
        </div>
        
        <div className="header-actions">
          {user && (
            <div className="user-name-display">
              <User size={16} style={{ color: 'var(--primary)' }} />
              <span>{user.username}</span>
            </div>
          )}
          <div className="sync-status">
            <span className="dot-success"></span>
            <span>Cloud Synced</span>
          </div>
          <button onClick={() => setShowSettings(true)} className="btn-icon" title="Adjust Goals">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="btn-secondary btn-logout-header" title="Log Out">
            <LogOut size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} /> Logout
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        
        {/* Left Column: Form & Settings */}
        <div className="side-column">
          
          {/* Goal Stats Banner */}
          <section className="glass-panel summary-metrics">
            <h3>Today's Focus</h3>
            
            {/* Metric Item: Calories */}
            <div className="metric-item">
              <div className="metric-info">
                <span>Calories Burned</span>
                <span className="metric-value">{todayCalories} / {goals.dailyCalorieTarget} kcal</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill fill-cal" 
                  style={{ width: `${Math.min(100, (todayCalories / goals.dailyCalorieTarget) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Metric Item: Duration */}
            <div className="metric-item">
              <div className="metric-info">
                <span>Active Time</span>
                <span className="metric-value">{todayDuration} / {goals.dailyDurationTarget} mins</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill fill-dur" 
                  style={{ width: `${Math.min(100, (todayDuration / goals.dailyDurationTarget) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Metric Item: Weekly Workouts */}
            <div className="metric-item">
              <div className="metric-info">
                <span>Weekly Session Goal</span>
                <span className="metric-value">{weeklyCount} / {goals.weeklyWorkoutsTarget} sessions</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill fill-week" 
                  style={{ width: `${Math.min(100, (weeklyCount / goals.weeklyWorkoutsTarget) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="streak-badge">
              <Flame size={24} className="streak-flame" />
              <div>
                <p className="streak-title">Active Streak</p>
                <p className="streak-count">{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</p>
              </div>
            </div>
          </section>

          {/* Log Workout Form */}
          <section className="glass-panel">
            <h2>Log Workout</h2>
            <form onSubmit={handleCreateWorkout} className="workout-form">
              
              <div className="form-group">
                <label>Workout Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Afternoon Swim, Gym session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Activity Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="cardio">🔥 Cardio</option>
                    <option value="strength">💪 Strength</option>
                    <option value="flexibility">🧘 Flexibility</option>
                    <option value="other">⚡ Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Workout Date</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (mins)</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="e.g. 45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Calories Burned</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes / Details (Optional)</label>
                <textarea 
                  rows="2"
                  placeholder="How did it feel? Sets, reps, route info..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Logging...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Log Workout
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Chart & History */}
        <div className="main-column">
          
          {/* Custom Weekly Bar Chart */}
          <section className="glass-panel chart-panel">
            <div className="chart-header">
              <h3>Weekly Progress</h3>
              <span>Active Minutes (Last 7 Days)</span>
            </div>
            
            <div className="custom-chart">
              {chartData.map((d, index) => {
                const heightPercent = Math.min(100, (d.minutes / goals.dailyDurationTarget) * 100);
                return (
                  <div key={index} className="chart-col">
                    <div className="chart-bar-container">
                      <div className="chart-bar-tooltip">
                        <strong>{d.minutes} mins</strong>
                        <p>{d.calories} kcal</p>
                      </div>
                      <div 
                        className={`chart-bar ${d.minutes >= goals.dailyDurationTarget ? 'bar-achieved' : ''}`}
                        style={{ height: `${Math.max(8, heightPercent)}%` }}
                      ></div>
                    </div>
                    <span className="chart-label">{d.dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Workouts History Feed */}
          <section className="glass-panel history-panel">
            <div className="history-header">
              <h2>Recent Activities</h2>
              
              {/* Filter tabs */}
              <div className="filter-tabs">
                <button 
                  onClick={() => setActiveTab('all')} 
                  className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveTab('cardio')} 
                  className={`tab-btn ${activeTab === 'cardio' ? 'active' : ''}`}
                >
                  Cardio
                </button>
                <button 
                  onClick={() => setActiveTab('strength')} 
                  className={`tab-btn ${activeTab === 'strength' ? 'active' : ''}`}
                >
                  Strength
                </button>
                <button 
                  onClick={() => setActiveTab('flexibility')} 
                  className={`tab-btn ${activeTab === 'flexibility' ? 'active' : ''}`}
                >
                  Flexibility
                </button>
              </div>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="spinner-container">
                <Loader2 size={36} className="animate-spin" />
                <p>Loading activities...</p>
              </div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="empty-state">
                <Activity size={40} className="empty-icon" />
                <p>No workouts recorded in this category yet.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {filteredWorkouts.map(w => (
                  <div key={w._id} className="activity-card glass-card">
                    <div className="activity-avatar">
                      {getWorkoutIcon(w.type)}
                    </div>
                    <div className="activity-details">
                      <div className="activity-title-row">
                        <h4>{w.title}</h4>
                        <span className="activity-type-badge">{w.type}</span>
                      </div>
                      <div className="activity-stats-row">
                        <span className="stat-pill">
                          <Clock size={12} />
                          {w.duration} mins
                        </span>
                        <span className="stat-pill">
                          <Flame size={12} />
                          {w.calories} kcal
                        </span>
                        <span className="stat-pill">
                          <Calendar size={12} />
                          {formatWorkoutDate(w.date)}
                        </span>
                      </div>
                      {w.notes && <p className="activity-notes">{w.notes}</p>}
                    </div>
                    <button 
                      onClick={() => handleDeleteWorkout(w._id)} 
                      className="btn-delete"
                      title="Delete log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

      {/* Target Settings Dialog Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Set Daily & Weekly Targets</h2>
              <button onClick={() => setShowSettings(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateGoals} className="modal-form">
              <div className="form-group">
                <label>Daily Calorie Target (kcal)</label>
                <input 
                  type="number"
                  min="1"
                  value={goalCal}
                  onChange={(e) => setGoalCal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Daily Active Minutes Target</label>
                <input 
                  type="number"
                  min="1"
                  value={goalDur}
                  onChange={(e) => setGoalDur(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Weekly Workouts Target (Sessions)</label>
                <input 
                  type="number"
                  min="1"
                  value={goalWeek}
                  onChange={(e) => setGoalWeek(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowSettings(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Spinner Styles */}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
