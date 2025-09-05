import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    search: ''
  });
  const [aiInsights, setAiInsights] = useState(null);
  const [showAIInsights, setShowAIInsights] = useState(false);


  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#17a2b8';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      // Update task status in database
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const getAIInsights = async () => {
    if (tasks.length === 0) {
      alert('No tasks to analyze. Please add some tasks first.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai/workload-analysis', {
        tasks: tasks,
        userProductivity: { averageTasksPerDay: 3, preferredWorkTime: 'morning' }
      });
      
      setAiInsights(response.data.analysis || response.data.fallback);
      setShowAIInsights(true);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      alert('Failed to get AI insights');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>📋 Task Dashboard</h2>
          <button
            onClick={getAIInsights}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "#6f42c1",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            🤖 Get AI Insights
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Search:</label>
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
            />
          </div>
        </div>

        {/* Task Count */}
        <div style={{ marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "5px" }}>
          <strong>Total Tasks:</strong> {tasks.length} | 
          <strong> Filtered:</strong> {filteredTasks.length} | 
          <strong> High Priority:</strong> {tasks.filter(t => t.priority === 'high').length} | 
          <strong> Pending:</strong> {tasks.filter(t => t.status === 'pending').length}
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
            {tasks.length === 0 ? "No tasks found. Create your first task!" : "No tasks match your filters."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>{task.title}</h3>
                    <p style={{ margin: "0 0 15px 0", color: "#666", lineHeight: "1.5" }}>
                      {task.description}
                    </p>
                    
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        color: "#fff",
                        background: getPriorityColor(task.priority)
                      }}>
                        {task.priority.toUpperCase()}
                      </span>
                      
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        color: "#fff",
                        background: getStatusColor(task.status)
                      }}>
                        {task.status || 'pending'}
                      </span>
                      
                      {task.course_code && (
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: "12px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          color: "#fff",
                          background: "#6f42c1"
                        }}>
                          {task.course_code}
                        </span>
                      )}
                      
                      {task.task_type && (
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: "12px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          color: "#fff",
                          background: "#17a2b8"
                        }}>
                          {task.task_type.toUpperCase()}
                        </span>
                      )}
                      
                      <span style={{ color: "#666", fontSize: "14px" }}>
                        📅 {formatDate(task.deadline)}
                      </span>
                      
                      {task.estimated_duration && (
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          ⏱️ {task.estimated_duration}min
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                    <select
                      value={task.status || 'pending'}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        fontSize: "12px"
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        padding: "6px 10px",
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* AI Analysis Display */}
                {task.ai_analysis && (
                  <div style={{ 
                    background: "#f8f9fa", 
                    padding: "15px", 
                    borderRadius: "5px", 
                    marginTop: "15px",
                    borderLeft: "4px solid #007bff"
                  }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>🤖 AI Insights</h4>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      <p><strong>Estimated Time:</strong> {task.ai_analysis.estimatedTime}</p>
                      {task.ai_analysis.subtasks && (
                        <div>
                          <strong>Suggested Subtasks:</strong>
                          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                            {task.ai_analysis.subtasks.map((subtask, index) => (
                              <li key={index}>{subtask}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && aiInsights && (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3>🤖 AI Workload Analysis</h3>
            <button
              onClick={() => setShowAIInsights(false)}
              style={{
                padding: "8px 12px",
                background: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <div style={{ background: "#e3f2fd", padding: "15px", borderRadius: "5px" }}>
              <h4>📊 Workload Assessment</h4>
              <p><strong>Status:</strong> {aiInsights.workloadAssessment}</p>
              <p><strong>Risk Level:</strong> {aiInsights.riskLevel}</p>
              <p><strong>Completion Prediction:</strong> {aiInsights.completionPrediction}</p>
              
              {aiInsights.priorityActions && aiInsights.priorityActions.length > 0 && (
                <div>
                  <p><strong>Priority Actions:</strong></p>
                  <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                    {aiInsights.priorityActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ background: "#fff3cd", padding: "15px", borderRadius: "5px" }}>
              <h4>⚠️ Bottlenecks</h4>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                {aiInsights.bottlenecks?.map((bottleneck, index) => (
                  <li key={index}>{bottleneck}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: "#d1ecf1", padding: "15px", borderRadius: "5px" }}>
              <h4>💡 Recommendations</h4>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                {aiInsights.recommendations?.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            {aiInsights.studyStrategy && (
              <div style={{ background: "#f8d7da", padding: "15px", borderRadius: "5px" }}>
                <h4>🎯 Study Strategy</h4>
                <p>{aiInsights.studyStrategy}</p>
              </div>
            )}

            {aiInsights.timeManagement && (
              <div style={{ background: "#d4edda", padding: "15px", borderRadius: "5px" }}>
                <h4>⏰ Time Management</h4>
                <p>{aiInsights.timeManagement}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;

