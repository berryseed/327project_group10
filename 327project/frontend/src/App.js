import React, { useState } from "react";
import TaskForm from "./TaskForm";
import AITaskForm from "./components/AITaskForm";
import TaskDashboard from "./components/TaskDashboard";
import StudentDashboard from "./components/StudentDashboard";

function App() {
  const [currentView, setCurrentView] = useState('student-dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'student-dashboard': return <StudentDashboard />;
      case 'ai-form': return <AITaskForm />;
      case 'dashboard': return <TaskDashboard />;
      case 'basic-form': return <TaskForm />;
      default: return <StudentDashboard />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        color: "white", 
        padding: "30px 20px",
        textAlign: "center"
      }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: "2.5rem" }}>🎓 Intelligent Student Task Planner</h1>
        <p style={{ margin: "0", fontSize: "1.2rem", opacity: "0.9" }}>
          AI-Powered Academic Planning, Smart Scheduling & Productivity Optimization
        </p>
      </div>

      {/* Navigation */}
      <div style={{ 
        background: "#fff", 
        padding: "20px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "15px", 
          justifyContent: "center", 
          flexWrap: "wrap" 
        }}>
          <button
            onClick={() => setCurrentView('student-dashboard')}
            style={{
              padding: "12px 24px",
              background: currentView === 'student-dashboard' ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
          >
            🎓 Student Dashboard
          </button>
          
          <button
            onClick={() => setCurrentView('ai-form')}
            style={{
              padding: "12px 24px",
              background: currentView === 'ai-form' ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
          >
            🤖 AI Task Form
          </button>
          
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              padding: "12px 24px",
              background: currentView === 'dashboard' ? "#6f42c1" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
          >
            📋 Task Dashboard
          </button>
          
          <button
            onClick={() => setCurrentView('basic-form')}
            style={{
              padding: "12px 24px",
              background: currentView === 'basic-form' ? "#fd7e14" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
          >
            📝 Basic Form
          </button>
        </div>
      </div>

      {/* Feature Highlights for Student Dashboard */}
      {currentView === 'student-dashboard' && (
        <div style={{ 
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", 
          padding: "20px", 
          borderRadius: "10px",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>🚀 Student Success Features</h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "15px",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            <div style={{ padding: "10px", background: "#fff", borderRadius: "8px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "5px" }}>🍅</div>
              <strong>Pomodoro Timer</strong><br/>
              <small>Focused study sessions</small>
            </div>
            <div style={{ padding: "10px", background: "#fff", borderRadius: "8px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "5px" }}>📅</div>
              <strong>Smart Scheduling</strong><br/>
              <small>AI-powered time optimization</small>
            </div>
            <div style={{ padding: "10px", background: "#fff", borderRadius: "8px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "5px" }}>📊</div>
              <strong>Progress Analytics</strong><br/>
              <small>Track your academic success</small>
            </div>
            <div style={{ padding: "10px", background: "#fff", borderRadius: "8px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "5px" }}>🎯</div>
              <strong>Academic Tasks</strong><br/>
              <small>Course-specific planning</small>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderView()}

      {/* Footer */}
      <div style={{ 
        background: "#343a40", 
        color: "white", 
        textAlign: "center", 
        padding: "30px 20px",
        marginTop: "50px"
      }}>
        <h3 style={{ margin: "0 0 15px 0" }}>🎓 Intelligent Student Task Planner</h3>
        <p style={{ margin: "0 0 15px 0", opacity: "0.8" }}>
          AI-Powered Academic Planning • Smart Scheduling • Productivity Optimization
        </p>
        <div style={{ fontSize: "0.9rem", opacity: "0.6" }}>
          Built with React, Node.js, MySQL, and OpenAI GPT-3.5
        </div>
      </div>
    </div>
  );
}

export default App;
