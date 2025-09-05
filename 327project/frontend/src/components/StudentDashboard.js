import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PomodoroTimer from './PomodoroTimer';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [tasksRes, coursesRes, preferencesRes, deadlinesRes] = await Promise.all([
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/user-preferences`),
        axios.get(`${API_BASE}/tasks/deadlines/7`)
      ]);

      setTasks(tasksRes.data);
      setCourses(coursesRes.data);
      setUserPreferences(preferencesRes.data);
      setUpcomingDeadlines(deadlinesRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'assignment': return '✍️';
      case 'exam': return '📚';
      case 'class': return '🎓';
      case 'study': return '📖';
      case 'project': return '🎯';
      default: return '📝';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#17a2b8';
      case 'pending': return '#ffc107';
      case 'overdue': return '#dc3545';
      default: return '#6c757d';
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

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Loading student dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "20px auto", padding: "20px" }}>
      {/* Navigation Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "30px", 
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'tasks', label: '📝 Tasks', icon: '📝' },
          { id: 'pomodoro', label: '🍅 Pomodoro Timer', icon: '🍅' },
          { id: 'courses', label: '🎓 Courses', icon: '🎓' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              background: activeTab === tab.id ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#28a745" }}>📚 Total Tasks</h3>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>{tasks.length}</div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                {tasks.filter(t => t.status === 'completed').length} completed
              </div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fd7e14" }}>⏰ Upcoming Deadlines</h3>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>
                {upcomingDeadlines.length}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>Next 7 days</div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#17a2b8" }}>🎓 Active Courses</h3>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>{courses.length}</div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>This semester</div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#6f42c1" }}>📊 Study Efficiency</h3>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>Completion rate</div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div style={{ background: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "30px" }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>🚨 Upcoming Deadlines</h2>
            {upcomingDeadlines.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>No upcoming deadlines! 🎉</p>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {upcomingDeadlines.slice(0, 5).map((task) => {
                  const daysUntil = getDaysUntilDeadline(task.deadline);
                  const isUrgent = daysUntil <= 1;
                  const isWarning = daysUntil <= 3;
                  
                  return (
                    <div
                      key={task.id}
                      style={{
                        background: isUrgent ? "#fff5f5" : isWarning ? "#fffbf0" : "#f8f9fa",
                        border: `2px solid ${isUrgent ? "#dc3545" : isWarning ? "#ffc107" : "#e9ecef"}`,
                        borderRadius: "8px",
                        padding: "15px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                          <span style={{ fontSize: "1.2rem" }}>
                            {getTaskTypeIcon(task.task_type)}
                          </span>
                          <h4 style={{ margin: "0", color: "#333" }}>{task.title}</h4>
                        </div>
                        <p style={{ margin: "5px 0", color: "#666", fontSize: "0.9rem" }}>
                          {task.course_name || 'No course'} • {task.description}
                        </p>
                        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
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
                            {task.status}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: "right" }}>
                        <div style={{ 
                          fontSize: "1.5rem", 
                          fontWeight: "bold",
                          color: isUrgent ? "#dc3545" : isWarning ? "#fd7e14" : "#28a745"
                        }}>
                          {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#666" }}>
                          {formatDate(task.deadline)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px" }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>⚡ Quick Actions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
              <button
                onClick={() => setActiveTab('tasks')}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #28a745, #20c997)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                ➕ Add New Task
              </button>
              
              <button
                onClick={() => setActiveTab('pomodoro')}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #007bff, #6610f2)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                🍅 Start Study Session
              </button>
              
              <button
                onClick={() => setActiveTab('courses')}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #fd7e14, #e83e8c)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                🎓 Manage Courses
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ background: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px" }}>
          <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>📝 Academic Tasks</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Use the AI Task Form to create intelligent, AI-enhanced academic tasks with smart prioritization and scheduling recommendations.
          </p>
          <button
            onClick={() => window.location.href = '/ai-form'}
            style={{
              padding: "15px 30px",
              background: "linear-gradient(135deg, #28a745, #20c997)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            🤖 Go to AI Task Form
          </button>
        </div>
      )}

      {activeTab === 'pomodoro' && (
        <PomodoroTimer 
          tasks={tasks}
          onSessionUpdate={fetchDashboardData}
        />
      )}

      {activeTab === 'courses' && (
        <div style={{ background: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px" }}>
          <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>🎓 My Courses</h2>
          
          {courses.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666" }}>No courses added yet. Add your first course!</p>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    background: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    padding: "20px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
                        {course.course_code} - {course.course_name}
                      </h3>
                      <p style={{ margin: "5px 0", color: "#666" }}>
                        <strong>Subject:</strong> {course.subject}
                      </p>
                      <p style={{ margin: "5px 0", color: "#666" }}>
                        <strong>Semester:</strong> {course.semester} {course.academic_year}
                      </p>
                      <p style={{ margin: "5px 0", color: "#666" }}>
                        <strong>Credits:</strong> {course.credits}
                      </p>
                      {course.instructor && (
                        <p style={{ margin: "5px 0", color: "#666" }}>
                          <strong>Instructor:</strong> {course.instructor}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                      <div style={{ 
                        padding: "8px 16px", 
                        background: "#007bff", 
                        color: "white", 
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "bold"
                      }}>
                        {tasks.filter(t => t.course_code === course.course_code).length} tasks
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
