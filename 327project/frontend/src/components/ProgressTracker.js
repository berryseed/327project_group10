import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProgressTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      const [tasksRes, sessionsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/study-sessions`),
        axios.get(`${API_BASE}/study-statistics/${selectedPeriod}`)
      ]);
      
      setTasks(tasksRes.data);
      setStudySessions(sessionsRes.data);
      setAnalytics(analyticsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const calculateCompletionRate = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const calculateAverageTimeAccuracy = () => {
    const tasksWithDuration = tasks.filter(task => task.estimated_duration && task.completed_at);
    if (tasksWithDuration.length === 0) return 0;
    
    // This would need actual time tracking data
    // For now, return a mock calculation
    return 85; // Mock percentage
  };

  const getCoursePerformance = () => {
    const courseStats = {};
    tasks.forEach(task => {
      if (task.course_code) {
        if (!courseStats[task.course_code]) {
          courseStats[task.course_code] = { total: 0, completed: 0 };
        }
        courseStats[task.course_code].total++;
        if (task.status === 'completed') {
          courseStats[task.course_code].completed++;
        }
      }
    });

    return Object.entries(courseStats).map(([course, stats]) => ({
      course,
      completionRate: Math.round((stats.completed / stats.total) * 100),
      totalTasks: stats.total,
      completedTasks: stats.completed
    }));
  };

  const getPriorityDistribution = () => {
    const distribution = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach(task => {
      if (distribution.hasOwnProperty(task.priority)) {
        distribution[task.priority]++;
      }
    });
    return distribution;
  };

  // const getWeeklyTrends = () => {
  //   // Mock weekly trends data
  //   const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  //   const completed = [3, 5, 4, 6];
  //   const planned = [5, 6, 5, 7];
    
  //   return { weeks, completed, planned };
  // };

  // const getProductivityHeatmap = () => {
  //   // Mock heatmap data for the last 30 days
  //   const heatmapData = [];
  //   const today = new Date();
    
  //   for (let i = 29; i >= 0; i--) {
  //     const date = new Date(today);
  //     date.setDate(date.getDate() - i);
      
  //     // Mock productivity score (0-4)
  //     const productivityScore = Math.floor(Math.random() * 5);
  //     heatmapData.push({
  //       date: date.toISOString().split('T')[0],
  //       score: productivityScore,
  //       tasksCompleted: Math.floor(Math.random() * 5)
  //     });
  //   }
    
  //   return heatmapData;
  // };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Loading progress data...</div>
      </div>
    );
  }

  const completionRate = calculateCompletionRate();
  const timeAccuracy = calculateAverageTimeAccuracy();
  const coursePerformance = getCoursePerformance();
  const priorityDistribution = getPriorityDistribution();
  // const weeklyTrends = getWeeklyTrends();
  // const heatmapData = getProductivityHeatmap();

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>📊 Progress Tracking & Analytics</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            style={{ padding: "8px 15px", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📈</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1976d2" }}>{completionRate}%</div>
            <div style={{ color: "#666" }}>Task Completion Rate</div>
          </div>
          
          <div style={{ background: "#f3e5f5", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏱️</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7b1fa2" }}>{timeAccuracy}%</div>
            <div style={{ color: "#666" }}>Time Estimation Accuracy</div>
          </div>
          
          <div style={{ background: "#e8f5e8", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📚</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#388e3c" }}>{tasks.length}</div>
            <div style={{ color: "#666" }}>Total Tasks</div>
          </div>
          
          <div style={{ background: "#fff3e0", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎯</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f57c00" }}>{tasks.filter(t => t.status === 'completed').length}</div>
            <div style={{ color: "#666" }}>Completed Tasks</div>
          </div>
        </div>

        {/* Course Performance */}
        <div style={{ marginBottom: "30px" }}>
          <h3>📚 Course-wise Performance</h3>
          {coursePerformance.length === 0 ? (
            <p style={{ color: "#6c757d", textAlign: "center", padding: "20px" }}>No course data available</p>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {coursePerformance.map((course, index) => (
                <div key={index} style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px", border: "1px solid #e9ecef" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <strong>{course.course}</strong>
                    <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: course.completionRate >= 80 ? "#28a745" : course.completionRate >= 60 ? "#ffc107" : "#dc3545" }}>
                      {course.completionRate}%
                    </span>
                  </div>
                  <div style={{ background: "#e9ecef", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        background: course.completionRate >= 80 ? "#28a745" : course.completionRate >= 60 ? "#ffc107" : "#dc3545",
                        height: "100%", 
                        width: `${course.completionRate}%`,
                        transition: "width 0.3s ease"
                      }}
                    />
                  </div>
                  <div style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}>
                    {course.completedTasks} of {course.totalTasks} tasks completed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div style={{ marginBottom: "30px" }}>
          <h3>🎯 Priority Distribution</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
            {Object.entries(priorityDistribution).map(([priority, count]) => (
              <div key={priority} style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: getPriorityColor(priority) }}>{count}</div>
                <div style={{ color: "#666", textTransform: "capitalize" }}>{priority} Priority</div>
              </div>
            ))}
          </div>
        </div>

        

        {/* Study Session Analytics */}
        {analytics && (
          <div>
            <h3>📚 Study Session Analytics</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1976d2" }}>
                  {analytics.totalSessions || 0}
                </div>
                <div style={{ color: "#666" }}>Total Study Sessions</div>
              </div>
              
              <div style={{ background: "#f3e5f5", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7b1fa2" }}>
                  {analytics.averageDuration || 0}min
                </div>
                <div style={{ color: "#666" }}>Average Session Duration</div>
              </div>
              
              <div style={{ background: "#e8f5e8", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#388e3c" }}>
                  {analytics.totalStudyTime || 0}h
                </div>
                <div style={{ color: "#666" }}>Total Study Time</div>
              </div>
              
              <div style={{ background: "#fff3e0", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f57c00" }}>
                  {analytics.averageProductivity || 0}%
                </div>
                <div style={{ color: "#666" }}>Average Productivity</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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

// const getHeatmapColor = (score) => {
//   switch (score) {
//     case 0: return '#ebedf0';
//     case 1: return '#c6e48b';
//     case 2: return '#7bc96f';
//     case 3: return '#239a3b';
//     case 4: return '#196127';
//     default: return '#ebedf0';
//   }
// };

export default ProgressTracker;
