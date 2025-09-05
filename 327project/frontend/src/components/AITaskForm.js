import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AITaskForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium'
  });
  
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [scheduleRecommendations, setScheduleRecommendations] = useState(null);
  const [workloadAnalysis, setWorkloadAnalysis] = useState(null);
  const [existingTasks, setExistingTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const API_BASE = 'http://localhost:5000';

  // Fetch existing tasks on component mount
  useEffect(() => {
    fetchExistingTasks();
  }, []);

  const fetchExistingTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/tasks`);
      setExistingTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // AI Task Analysis
  const analyzeTask = async () => {
    if (!formData.title || !formData.description) {
      alert('Please enter title and description first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/analyze-task`, formData);
      // Handle the response structure: {success: true, data: {...}} or {success: false, fallback: {...}}
      const analysisData = response.data.success ? response.data.data : response.data.fallback;
      setAiAnalysis(analysisData);
      setShowAI(true);
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get AI Task Suggestions
  const getTaskSuggestions = async () => {
    if (!formData.title) {
      alert('Please enter a task title first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/task-suggestions`, {
        existingTasks,
        userInput: formData.title
      });
      // Handle the response structure: {success: true, data: {...}} or {success: false, fallback: {...}}
      const suggestionsData = response.data.success ? response.data.data : response.data.fallback;
      setAiSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      console.error('Task suggestions error:', error);
      alert('Failed to get task suggestions.');
    } finally {
      setLoading(false);
    }
  };

  // Get Schedule Recommendations
  const getScheduleRecommendations = async () => {
    if (existingTasks.length === 0) {
      alert('No existing tasks to analyze. Please add some tasks first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/schedule-recommendations`, {
        tasks: existingTasks,
        userPreferences: { workHours: '9-5', preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      });
      // Handle the response structure: {success: true, data: {...}} or {success: false, fallback: {...}}
      const recommendationsData = response.data.success ? response.data.data : response.data.fallback;
      setScheduleRecommendations(recommendationsData);
    } catch (error) {
      console.error('Schedule recommendations error:', error);
      alert('Failed to get schedule recommendations.');
    } finally {
      setLoading(false);
    }
  };

  // Get Workload Analysis
  const getWorkloadAnalysis = async () => {
    if (existingTasks.length === 0) {
      alert('No existing tasks to analyze. Please add some tasks first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/workload-analysis`, {
        tasks: existingTasks,
        userProductivity: { averageTasksPerDay: 3, preferredWorkTime: 'morning' }
      });
      // Handle the response structure: {success: true, data: {...}} or {success: false, fallback: {...}}
      const workloadData = response.data.success ? response.data.data : response.data.fallback;
      setWorkloadAnalysis(workloadData);
    } catch (error) {
      console.error('Workload analysis error:', error);
      alert('Failed to get workload analysis.');
    } finally {
      setLoading(false);
    }
  };

  // Submit enhanced task with AI analysis
  const handleSubmitEnhanced = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/enhanced-task`, formData);
      alert('✅ AI-enhanced task created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium'
      });
      setAiAnalysis(null);
      setShowAI(false);
      
      // Refresh task list
      fetchExistingTasks();
    } catch (error) {
      console.error('Error creating enhanced task:', error);
      alert('Failed to create enhanced task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
        <h2>🤖 AI-Enhanced Task Planner</h2>
        
        <form onSubmit={handleSubmitEnhanced}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Task Title: *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
              placeholder="Enter your task title..."
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description: *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="3"
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
              placeholder="Describe your task in detail..."
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Deadline:</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Priority:</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={analyzeTask}
              disabled={loading}
              style={{ 
                padding: "10px 15px", 
                background: "#28a745", 
                color: "#fff", 
                border: "none", 
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Analyzing..." : "🔍 AI Task Analysis"}
            </button>

            <button
              type="button"
              onClick={getTaskSuggestions}
              disabled={loading}
              style={{ 
                padding: "10px 15px", 
                background: "#17a2b8", 
                color: "#fff", 
                border: "none", 
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              💡 Get Suggestions
            </button>

            <button
              type="button"
              onClick={getScheduleRecommendations}
              disabled={loading}
              style={{ 
                padding: "10px 15px", 
                background: "#ffc107", 
                color: "#000", 
                border: "none", 
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              📅 Schedule Tips
            </button>

            <button
              type="button"
              onClick={getWorkloadAnalysis}
              disabled={loading}
              style={{ 
                padding: "10px 15px", 
                background: "#dc3545", 
                color: "#fff", 
                border: "none", 
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              📊 Workload Analysis
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              background: "#007bff", 
              color: "#fff", 
              border: "none", 
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Creating..." : "🚀 Create AI-Enhanced Task"}
          </button>
        </form>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
          <h3>🤖 AI Task Analysis</h3>
          <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
            <p><strong>Suggested Priority:</strong> {aiAnalysis.suggestedPriority}</p>
            <p><strong>Reasoning:</strong> {aiAnalysis.priorityReasoning}</p>
            <p><strong>Deadline:</strong> {aiAnalysis.deadlineAdjustment}</p>
            <p><strong>Estimated Time:</strong> {aiAnalysis.estimatedTime}</p>
            <p><strong>Subtasks:</strong></p>
            <ul>
              {aiAnalysis.subtasks?.map((subtask, index) => (
                <li key={index}>{subtask}</li>
              ))}
            </ul>
            <p><strong>Risks:</strong></p>
            <ul>
              {aiAnalysis.risks?.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Task Suggestions */}
      {aiSuggestions.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
          <h3>💡 AI Task Suggestions</h3>
          {aiSuggestions.map((suggestion, index) => (
            <div key={index} style={{ background: "#e3f2fd", padding: "15px", borderRadius: "5px", marginBottom: "10px" }}>
              <h4>{suggestion.title}</h4>
              <p><strong>Description:</strong> {suggestion.description}</p>
              <p><strong>Priority:</strong> {suggestion.priority}</p>
              <p><strong>Reasoning:</strong> {suggestion.reasoning}</p>
              {suggestion.estimatedDuration && <p><strong>Estimated Duration:</strong> {suggestion.estimatedDuration}</p>}
              {suggestion.taskType && <p><strong>Task Type:</strong> {suggestion.taskType}</p>}
              {suggestion.studyTips && suggestion.studyTips.length > 0 && (
                <div>
                  <strong>Study Tips:</strong>
                  <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                    {suggestion.studyTips.map((tip, tipIndex) => (
                      <li key={tipIndex}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Recommendations */}
      {scheduleRecommendations && (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
          <h3>📅 AI Schedule Recommendations</h3>
          <div style={{ background: "#fff3cd", padding: "15px", borderRadius: "5px" }}>
            <p><strong>Recommended Order:</strong></p>
            <ol>
              {scheduleRecommendations.recommendedOrder?.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ol>
            <p><strong>Workload Balance:</strong> {scheduleRecommendations.workloadBalance}</p>
            <p><strong>Estimated Completion:</strong> {scheduleRecommendations.estimatedCompletion}</p>
            
            {scheduleRecommendations.studyTips && scheduleRecommendations.studyTips.length > 0 && (
              <div>
                <p><strong>Study Tips:</strong></p>
                <ul>
                  {scheduleRecommendations.studyTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {scheduleRecommendations.breakRecommendations && scheduleRecommendations.breakRecommendations.length > 0 && (
              <div>
                <p><strong>Break Recommendations:</strong></p>
                <ul>
                  {scheduleRecommendations.breakRecommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {scheduleRecommendations.deadlineStrategy && (
              <p><strong>Deadline Strategy:</strong> {scheduleRecommendations.deadlineStrategy}</p>
            )}
            
            {scheduleRecommendations.productivityOptimization && (
              <p><strong>Productivity Tips:</strong> {scheduleRecommendations.productivityOptimization}</p>
            )}
            
            <p><strong>Risk Factors:</strong></p>
            <ul>
              {scheduleRecommendations.riskFactors?.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Workload Analysis */}
      {workloadAnalysis && (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
          <h3>📊 AI Workload Analysis</h3>
          <div style={{ background: "#d1ecf1", padding: "15px", borderRadius: "5px" }}>
            <p><strong>Workload Assessment:</strong> {workloadAnalysis.workloadAssessment}</p>
            <p><strong>Completion Prediction:</strong> {workloadAnalysis.completionPrediction}</p>
            <p><strong>Risk Level:</strong> {workloadAnalysis.riskLevel}</p>
            
            {workloadAnalysis.priorityActions && workloadAnalysis.priorityActions.length > 0 && (
              <div>
                <p><strong>Priority Actions:</strong></p>
                <ul>
                  {workloadAnalysis.priorityActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {workloadAnalysis.studyStrategy && (
              <p><strong>Study Strategy:</strong> {workloadAnalysis.studyStrategy}</p>
            )}
            
            {workloadAnalysis.timeManagement && (
              <p><strong>Time Management:</strong> {workloadAnalysis.timeManagement}</p>
            )}
            
            <p><strong>Bottlenecks:</strong></p>
            <ul>
              {workloadAnalysis.bottlenecks?.map((bottleneck, index) => (
                <li key={index}>{bottleneck}</li>
              ))}
            </ul>
            <p><strong>Recommendations:</strong></p>
            <ul>
              {workloadAnalysis.recommendations?.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskForm;

