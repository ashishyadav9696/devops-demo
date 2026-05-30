import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckSquare, 
  FileText, 
  Sparkles,
  Loader2
} from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, priority })
      });

      if (!response.ok) throw new Error('Failed to create task');
      const newTask = await response.json();
      
      setTasks([newTask, ...tasks]);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
    } catch (err) {
      console.error(err);
      alert('Error creating task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId, currentStatus, direction) => {
    const statuses = ['todo', 'in_progress', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= statuses.length) return;
    const nextStatus = statuses[nextIndex];

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: nextStatus } : t));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) throw new Error('Failed to update task status');
      const updatedTask = await response.json();
      
      // Update with exact response from server
      setTasks(prev => prev.map(t => t._id === taskId ? updatedTask : t));
    } catch (err) {
      console.error(err);
      // Revert if error
      setTasks(previousTasks);
      alert('Could not update status. Reverting change.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t._id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete task');
    } catch (err) {
      console.error(err);
      // Revert if error
      setTasks(previousTasks);
      alert('Could not delete task. Reverting.');
    }
  };

  // Helper to categorize tasks
  const getTasksByStatus = (statusName) => {
    return tasks.filter(t => t.status === statusName);
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'low':
        return <span className="badge badge-low">Low</span>;
      case 'high':
        return <span className="badge badge-high">High</span>;
      default:
        return <span className="badge badge-medium">Medium</span>;
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* Premium Header */}
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={24} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Development Workspace
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            Task<span className="text-gradient">Flow</span>
          </h1>
        </div>
        
        {/* Status Indicators */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>MongoDB Connected</span>
          </div>
          <button onClick={fetchTasks} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Sync Space
          </button>
        </div>
      </header>

      {/* Main Grid: Create Task + Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        
        {/* Create Task Form Glass Panel */}
        <section className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} style={{ color: 'var(--primary)' }} /> Add New Task
          </h2>
          <form onSubmit={handleCreateTask} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Task Title</label>
              <input 
                type="text" 
                placeholder="What needs to be accomplished?" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Description (Optional)</label>
              <textarea 
                rows="2" 
                placeholder="Provide short details about this task..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Initial State</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Add to Workspace
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Server State / Connection Error */}
        {error && (
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertCircle size={24} style={{ color: 'var(--danger)' }} />
            <div>
              <p style={{ fontWeight: 600 }}>Connection Error</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
            <Loader2 size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading Workspace Tasks...</p>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          /* Kanban Board Grid */
          <div className="board-grid">
            
            {/* COLUMN: To Do */}
            <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
                  <Clock size={18} style={{ color: 'var(--text-secondary)' }} /> To Do
                </h3>
                <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {getTasksByStatus('todo').length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getTasksByStatus('todo').length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>No tasks to do.</p>
                ) : (
                  getTasksByStatus('todo').map(task => renderTaskCard(task))
                )}
              </div>
            </div>

            {/* COLUMN: In Progress */}
            <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
                  <CheckSquare size={18} style={{ color: 'var(--warning)' }} /> In Progress
                </h3>
                <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {getTasksByStatus('in_progress').length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getTasksByStatus('in_progress').length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>No active tasks.</p>
                ) : (
                  getTasksByStatus('in_progress').map(task => renderTaskCard(task))
                )}
              </div>
            </div>

            {/* COLUMN: Done */}
            <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
                  <Check size={18} style={{ color: 'var(--success)' }} /> Completed
                </h3>
                <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {getTasksByStatus('done').length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getTasksByStatus('done').length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>Done is empty.</p>
                ) : (
                  getTasksByStatus('done').map(task => renderTaskCard(task))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );

  // Sub-render function for a Task card
  function renderTaskCard(task) {
    return (
      <div 
        key={task._id} 
        className="glass-card animate-fade-in" 
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <h4 style={{ fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-word', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {task.title}
          </h4>
          {getPriorityBadge(task.priority)}
        </div>

        {task.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <FileText size={14} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--text-muted)' }} />
            <span style={{ wordBreak: 'break-word' }}>{task.description}</span>
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Delete Action */}
          <button 
            onClick={() => handleDeleteTask(task._id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px', transition: 'all var(--transition-fast)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>

          {/* Status Progression Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {task.status !== 'todo' && (
              <button 
                onClick={() => handleUpdateStatus(task._id, task.status, -1)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '4px', transition: 'all var(--transition-fast)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                title="Move Back"
              >
                <ArrowLeft size={14} />
              </button>
            )}

            {task.status !== 'done' && (
              <button 
                onClick={() => handleUpdateStatus(task._id, task.status, 1)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '4px', transition: 'all var(--transition-fast)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                title="Move Forward"
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
