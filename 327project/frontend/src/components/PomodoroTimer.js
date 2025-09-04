import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const PomodoroTimer = ({ tasks, onSessionUpdate }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionType, setSessionType] = useState('pomodoro');
  const [sessionDuration, setSessionDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedTask, setSelectedTask] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [productivityScore, setProductivityScore] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const timerRef = useRef(null);
  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const fetchSessionHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pomodoro/history`);
      if (response.data.success) {
        setSessionHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    }
  };

  const startSession = async () => {
    if (!selectedTask) {
      alert('Please select a task to work on');
      return;
    }

    const task = tasks.find(t => t.id == selectedTask);
    if (!task) return;

    try {
      const response = await axios.post(`${API_BASE}/pomodoro/start`, {
        taskId: selectedTask,
        taskTitle: task.title,
        sessionType: sessionType,
        duration: sessionDuration,
        notes: sessionNotes
      });

      if (response.data.success) {
        setActiveSession(response.data.session);
        setTimeLeft(sessionDuration * 60);
        setIsRunning(true);
        setIsPaused(false);
        setIsBreak(false);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    }
  };

  const pauseSession = async () => {
    if (!activeSession) return;

    try {
      const response = await axios.post(`${API_BASE}/pomodoro/${activeSession.id}/pause`);
      if (response.data.success) {
        setIsPaused(true);
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  };

  const resumeSession = async () => {
    if (!activeSession) return;

    try {
      const response = await axios.post(`${API_BASE}/pomodoro/${activeSession.id}/resume`);
      if (response.data.success) {
        setIsPaused(false);
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  };

  const takeBreak = async () => {
    if (!activeSession) return;

    try {
      const response = await axios.post(`${API_BASE}/pomodoro/${activeSession.id}/break`, {
        duration: breakDuration,
        type: 'short'
      });
      if (response.data.success) {
        setIsBreak(true);
        setIsRunning(false);
        setTimeLeft(breakDuration * 60);
      }
    } catch (error) {
      console.error('Error taking break:', error);
    }
  };

  const endBreak = async () => {
    if (!activeSession) return;

    try {
      const response = await axios.post(`${API_BASE}/pomodoro/${activeSession.id}/break/end`);
      if (response.data.success) {
        setIsBreak(false);
        setIsRunning(true);
        setTimeLeft(sessionDuration * 60);
      }
    } catch (error) {
      console.error('Error ending break:', error);
    }
  };

  const handleSessionComplete = async () => {
    if (!activeSession) return;

    try {
      const response = await axios.post(`${API_BASE}/pomodoro/${activeSession.id}/complete`, {
        productivityScore: productivityScore,
        notes: sessionNotes
      });

      if (response.data.success) {
        setActiveSession(null);
        setIsRunning(false);
        setIsPaused(false);
        setIsBreak(false);
        setTimeLeft(0);
        setSelectedTask('');
        setSessionNotes('');
        setProductivityScore(0);
        
        if (onSessionUpdate) {
          onSessionUpdate();
        }
        
        fetchSessionHistory();
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const cancelSession = () => {
    setActiveSession(null);
    setIsRunning(false);
    setIsPaused(false);
    setIsBreak(false);
    setTimeLeft(0);
    setSelectedTask('');
    setSessionNotes('');
    setProductivityScore(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!activeSession) return 0;
    const totalTime = sessionDuration * 60;
    const elapsed = totalTime - timeLeft;
    return (elapsed / totalTime) * 100;
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Timer Display */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        color: "white", 
        padding: "40px",
        borderRadius: "20px",
        textAlign: "center",
        marginBottom: "30px"
      }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "2rem" }}>
          {isBreak ? "☕ Break Time" : "🍅 Pomodoro Timer"}
        </h2>
        
        <div style={{ fontSize: "4rem", fontWeight: "bold", marginBottom: "20px" }}>
          {formatTime(timeLeft)}
        </div>
        
        {/* Progress Bar */}
        <div style={{ 
          width: "100%", 
          height: "10px", 
          background: "rgba(255,255,255,0.3)", 
          borderRadius: "5px",
          marginBottom: "20px"
        }}>
          <div style={{ 
            width: `${getProgressPercentage()}%`, 
            height: "100%", 
            background: "#fff", 
            borderRadius: "5px",
            transition: "width 1s ease"
          }} />
        </div>
        
        {/* Session Info */}
        {activeSession && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>Working on: {activeSession.taskTitle}</h3>
            <p style={{ margin: "0", opacity: "0.9" }}>
              {sessionType} session • {sessionDuration} minutes
            </p>
          </div>
        )}
      </div>

      {/* Session Controls */}
      {!activeSession ? (
        <div style={{ background: "#fff", borderRadius: "15px", boxShadow: "0 2px 20px rgba(0,0,0,0.1)", padding: "30px", marginBottom: "30px" }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>🎯 Start New Study Session</h3>
          
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Task Selection */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                Select Task to Work On: *
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "8px", 
                  border: "1px solid #ddd",
                  fontSize: "16px"
                }}
              >
                <option value="">Choose a task...</option>
                {tasks.filter(t => t.status !== 'completed').map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.course_name || 'No course'})
                  </option>
                ))}
              </select>
            </div>

            {/* Session Type */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                Session Type:
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "8px", 
                  border: "1px solid #ddd",
                  fontSize: "16px"
                }}
              >
                <option value="pomodoro">🍅 Pomodoro (25 min)</option>
                <option value="study">📚 Study Session (Custom)</option>
                <option value="review">📖 Review Session (15 min)</option>
              </select>
            </div>

            {/* Duration Settings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                  Session Duration (minutes):
                </label>
                <input
                  type="number"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value) || 25)}
                  min="5"
                  max="120"
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid #ddd",
                    fontSize: "16px"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                  Break Duration (minutes):
                </label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                  min="1"
                  max="30"
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid #ddd",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>

            {/* Session Notes */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                Session Goals/Notes:
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows="3"
                placeholder="What do you want to accomplish in this session?"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "8px", 
                  border: "1px solid #ddd",
                  fontSize: "16px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Start Button */}
            <button
              onClick={startSession}
              disabled={!selectedTask}
              style={{
                width: "100%",
                padding: "15px",
                background: selectedTask ? "linear-gradient(135deg, #28a745, #20c997)" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: selectedTask ? "pointer" : "not-allowed",
                transition: "all 0.3s ease"
              }}
            >
              🚀 Start Study Session
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "15px", boxShadow: "0 2px 20px rgba(0,0,0,0.1)", padding: "30px", marginBottom: "30px" }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>Session Controls</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
            {isPaused ? (
              <button
                onClick={resumeSession}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #28a745, #20c997)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={pauseSession}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #ffc107, #fd7e14)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                ⏸️ Pause
              </button>
            )}

            {!isBreak && (
              <button
                onClick={takeBreak}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #17a2b8, #6f42c1)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                ☕ Take Break
              </button>
            )}

            {isBreak && (
              <button
                onClick={endBreak}
                style={{
                  padding: "15px",
                  background: "linear-gradient(135deg, #fd7e14, #e83e8c)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                🔄 End Break
              </button>
            )}

            <button
              onClick={cancelSession}
              style={{
                padding: "15px",
                background: "linear-gradient(135deg, #dc3545, #e83e8c)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              ❌ Cancel
            </button>
          </div>

          {/* Productivity Score */}
          {!isBreak && (
            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                Rate your productivity (0-100):
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={productivityScore}
                onChange={(e) => setProductivityScore(parseInt(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ textAlign: "center", marginTop: "5px", color: "#666" }}>
                {productivityScore}/100
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      <div style={{ background: "#fff", borderRadius: "15px", boxShadow: "0 2px 20px rgba(0,0,0,0.1)", padding: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: "0", color: "#333" }}>📊 Session History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: "10px 20px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            {showHistory ? "Hide" : "Show"} History
          </button>
        </div>

        {showHistory && (
          <div>
            {sessionHistory.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>No sessions completed yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {sessionHistory.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      padding: "15px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                          {session.taskTitle}
                        </h4>
                        <p style={{ margin: "5px 0", color: "#666", fontSize: "0.9rem" }}>
                          <strong>Type:</strong> {session.sessionType} • 
                          <strong> Duration:</strong> {session.actualDuration} min • 
                          <strong> Date:</strong> {new Date(session.startTime).toLocaleDateString()}
                        </p>
                        {session.notes && (
                          <p style={{ margin: "5px 0", color: "#666", fontSize: "0.9rem" }}>
                            <strong>Notes:</strong> {session.notes}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ textAlign: "right" }}>
                        <div style={{ 
                          padding: "6px 12px", 
                          background: "#007bff", 
                          color: "white", 
                          borderRadius: "15px",
                          fontSize: "14px",
                          fontWeight: "bold"
                        }}>
                          {session.productivityScore}/100
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
    </div>
  );
};

export default PomodoroTimer;

