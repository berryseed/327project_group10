// Import required libraries
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require('dotenv').config();

// Import services
const aiService = require('./services/aiService');
const smartScheduler = require('./services/smartScheduler');
const pomodoroTimer = require('./services/pomodoroTimer');
const Task = require('./models/Task');

// Create an Express app
const app = express();

// Middleware (helps handle requests properly)
app.use(cors());
app.use(express.json()); // instead of body-parser (modern way)

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "int@2024hashGG",
  database: process.env.DB_NAME || "taskplanner"
});

// Initialize Task model
const taskModel = new Task(db);

// Check MySQL connection and initialize tables
db.connect(async (err) => {
  if (err) {
    console.error("Database connection failed: ", err);
    return;
  }
  console.log("✅ MySQL connected...");
  
  try {
    await taskModel.initializeTables();
    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing tables:", error);
  }
});

// Default route (test)
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// ===== CORE TASK MANAGEMENT =====

// Get all tasks with enhanced student information
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await taskModel.getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get tasks by course
app.get("/tasks/course/:courseCode", async (req, res) => {
  try {
    const tasks = await taskModel.getTasksByCourse(req.params.courseCode);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks by course:", error);
    res.status(500).json({ error: "Failed to fetch tasks by course" });
  }
});

// Get upcoming deadlines
app.get("/tasks/deadlines/:days", async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const tasks = await taskModel.getUpcomingDeadlines(days);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching upcoming deadlines:", error);
    res.status(500).json({ error: "Failed to fetch upcoming deadlines" });
  }
});

// Create enhanced task with student-specific fields
app.post("/tasks", async (req, res) => {
  try {
    const taskData = req.body;
    const newTask = await taskModel.createEnhancedTask(taskData);
    res.status(201).json({ 
      message: "Task created successfully", 
      task: newTask 
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
app.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, deadline, priority, status, task_type, course_code, estimated_duration } = req.body;

    let sql = "UPDATE tasks SET ";
    let values = [];
    let updates = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (deadline !== undefined) {
      updates.push("deadline = ?");
      values.push(deadline);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (task_type !== undefined) {
      updates.push("task_type = ?");
      values.push(task_type);
    }
    if (course_code !== undefined) {
      updates.push("course_code = ?");
      values.push(course_code);
    }
    if (estimated_duration !== undefined) {
      updates.push("estimated_duration = ?");
      values.push(estimated_duration);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    sql += updates.join(", ") + " WHERE id = ?";
    values.push(taskId);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating task:", err);
        return res.status(500).json({ error: "Database update failed" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json({ message: "Task updated successfully" });
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Update task status
app.patch("/tasks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const success = await taskModel.updateTaskStatus(req.params.id, status);
    
    if (success) {
      res.json({ message: "Task status updated successfully" });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// Delete task
app.delete("/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  
  const sql = "DELETE FROM tasks WHERE id = ?";
  
  db.query(sql, [taskId], (err, result) => {
    if (err) {
      console.error("Error deleting task:", err);
      return res.status(500).json({ error: "Database delete failed" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json({ message: "Task deleted successfully" });
  });
});

// ===== SMART SCHEDULING =====

// Generate smart time slots
app.post("/scheduler/time-slots", async (req, res) => {
  try {
    const { tasks, userPreferences, availableTime } = req.body;
    const result = await smartScheduler.generateTimeSlots(tasks, userPreferences, availableTime);
    res.json(result);
  } catch (error) {
    console.error("Error generating time slots:", error);
    res.status(500).json({ error: "Failed to generate time slots" });
  }
});

// Create optimal study schedule
app.post("/scheduler/optimal-schedule", async (req, res) => {
  try {
    const { tasks, userPreferences, constraints } = req.body;
    const result = await smartScheduler.createOptimalSchedule(tasks, userPreferences, constraints);
    res.json(result);
  } catch (error) {
    console.error("Error creating optimal schedule:", error);
    res.status(500).json({ error: "Failed to create optimal schedule" });
  }
});

// ===== POMODORO TIMER =====

// Start Pomodoro session
app.post("/pomodoro/start", (req, res) => {
  try {
    const result = pomodoroTimer.startSession(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error starting Pomodoro session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// Pause session
app.post("/pomodoro/:sessionId/pause", (req, res) => {
  try {
    const result = pomodoroTimer.pauseSession(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error pausing session:", error);
    res.status(500).json({ error: "Failed to pause session" });
  }
});

// Resume session
app.post("/pomodoro/:sessionId/resume", (req, res) => {
  try {
    const result = pomodoroTimer.resumeSession(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error resuming session:", error);
    res.status(500).json({ error: "Failed to resume session" });
  }
});

// Complete session
app.post("/pomodoro/:sessionId/complete", (req, res) => {
  try {
    const result = pomodoroTimer.completeSession(req.params.sessionId, req.body);
    res.json(result);
  } catch (error) {
    console.error("Error completing session:", error);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

// Take break
app.post("/pomodoro/:sessionId/break", (req, res) => {
  try {
    const result = pomodoroTimer.takeBreak(req.params.sessionId, req.body);
    res.json(result);
  } catch (error) {
    console.error("Error taking break:", error);
    res.status(500).json({ error: "Failed to take break" });
  }
});

// End break
app.post("/pomodoro/:sessionId/break/end", (req, res) => {
  try {
    const result = pomodoroTimer.endBreak(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error ending break:", error);
    res.status(500).json({ error: "Failed to end break" });
  }
});

// Get active sessions
app.get("/pomodoro/active", (req, res) => {
  try {
    const sessions = pomodoroTimer.getActiveSessions();
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

// Get session history
app.get("/pomodoro/history", (req, res) => {
  try {
    const history = pomodoroTimer.getSessionHistory(req.query);
    res.json({ success: true, history });
  } catch (error) {
    console.error("Error fetching session history:", error);
    res.status(500).json({ error: "Failed to fetch session history" });
  }
});

// Get productivity analytics
app.get("/pomodoro/analytics/:days", (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const result = pomodoroTimer.getProductivityAnalytics(days);
    res.json(result);
  } catch (error) {
    console.error("Error fetching productivity analytics:", error);
    res.status(500).json({ error: "Failed to fetch productivity analytics" });
  }
});

// ===== AI-POWERED FEATURES =====

// AI Task Analysis
app.post("/ai/analyze-task", async (req, res) => {
  try {
    const { title, description, deadline, priority } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const taskData = { title, description, deadline, priority: priority || 'medium' };
    const analysis = await aiService.analyzeTask(taskData);
    
    res.json(analysis);
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

// AI-Powered Schedule Recommendations
app.post("/ai/schedule-recommendations", async (req, res) => {
  try {
    const { tasks, userPreferences } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required" });
    }

    const recommendations = await aiService.getScheduleRecommendations(tasks, userPreferences);
    res.json(recommendations);
  } catch (error) {
    console.error("Schedule recommendation error:", error);
    res.status(500).json({ error: "Schedule recommendation failed" });
  }
});

// AI-powered full schedule planner
app.post("/ai/plan-schedule", async (req, res) => {
  try {
    const { userDescription, userPreferences, constraints } = req.body;

    if (!userDescription) {
      return res.status(400).json({ error: "User description is required" });
    }

    // Call AI service to generate schedule
    const tasksFromAI = await aiService.planFullSchedule(userDescription, userPreferences, constraints);

    // If AI returned fallback text instead of JSON
    if (tasksFromAI.fallback) {
      return res.status(500).json({ error: "AI output invalid", details: tasksFromAI.fallback });
    }

    // Save tasks to database
    const insertedTasks = [];
    for (const task of tasksFromAI) {
      const sql = "INSERT INTO tasks (title, description, deadline, priority, estimated_duration, ai_analysis, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
      const aiAnalysisJson = JSON.stringify(task.aiAnalysis || {});
      
      const [result] = await db.promise().query(sql, [
        task.title,
        task.description,
        task.deadline,
        task.priority || 'medium',
        task.estimated_duration || 60,
        aiAnalysisJson,
        'pending'
      ]);

      task.id = result.insertId;
      insertedTasks.push(task);
    }

    res.status(201).json({
      message: "AI-generated schedule saved successfully",
      tasks: insertedTasks
    });

  } catch (error) {
    console.error("Error planning AI schedule:", error);
    res.status(500).json({ error: "Failed to plan schedule" });
  }
});



// AI-Powered Task Suggestions
app.post("/ai/task-suggestions", async (req, res) => {
  try {
    const { existingTasks, userInput } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ error: "User input is required" });
    }

    const suggestions = await aiService.generateTaskSuggestions(existingTasks || [], userInput);
    res.json(suggestions);
  } catch (error) {
    console.error("Task suggestion error:", error);
    res.status(500).json({ error: "Task suggestion failed" });
  }
});

// AI-Powered Workload Analysis
app.post("/ai/workload-analysis", async (req, res) => {
  try {
    const { tasks, userProductivity } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required" });
    }

    const analysis = await aiService.analyzeWorkload(tasks, userProductivity);
    res.json(analysis);
  } catch (error) {
    console.error("Workload analysis error:", error);
    res.status(500).json({ error: "Workload analysis failed" });
  }
});

// Get AI-enhanced task with analysis
app.post("/ai/enhanced-task", async (req, res) => {
  try {
    const { title, description, deadline, priority } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const taskData = { title, description, deadline, priority: priority || 'medium' };
    
    // Get AI analysis
    const analysis = await aiService.analyzeTask(taskData);
    
    // Create enhanced task object
    const enhancedTask = {
      ...taskData,
      aiAnalysis: analysis.analysis || analysis.fallback,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Save to database
    const sql = "INSERT INTO tasks (title, description, deadline, priority, ai_analysis, status) VALUES (?, ?, ?, ?, ?, ?)";
    const aiAnalysisJson = JSON.stringify(enhancedTask.aiAnalysis);
    
    db.query(sql, [title, description, deadline, priority, aiAnalysisJson, 'pending'], (err, result) => {
      if (err) {
        console.error("Error inserting enhanced task:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }
      
      enhancedTask.id = result.insertId;
      res.status(201).json({ 
        message: "Enhanced task created successfully", 
        task: enhancedTask 
      });
    });
  } catch (error) {
    console.error("Enhanced task creation error:", error);
    res.status(500).json({ error: "Enhanced task creation failed" });
  }
});

// ===== STUDY SESSIONS =====

// Record study session
app.post("/study-sessions", async (req, res) => {
  try {
    const sessionData = req.body;
    const newSession = await taskModel.recordStudySession(sessionData);
    res.status(201).json({ 
      message: "Study session recorded successfully", 
      session: newSession 
    });
  } catch (error) {
    console.error("Error recording study session:", error);
    res.status(500).json({ error: "Failed to record study session" });
  }
});

// Get study statistics
app.get("/study-statistics/:days", async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const stats = await taskModel.getStudyStatistics(days);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching study statistics:", error);
    res.status(500).json({ error: "Failed to fetch study statistics" });
  }
});

// ===== USER PREFERENCES =====

// Get user preferences
app.get("/user-preferences", async (req, res) => {
  try {
    const preferences = await taskModel.getUserPreferences();
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});

// Update user preferences
app.put("/user-preferences", async (req, res) => {
  try {
    const success = await taskModel.updateUserPreferences(1, req.body);
    
    if (success) {
      res.json({ message: "User preferences updated successfully" });
    } else {
      res.status(404).json({ error: "User preferences not found" });
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

// ===== COURSE MANAGEMENT =====

// Get all courses
app.get("/courses", (req, res) => {
  const sql = "SELECT * FROM courses ORDER BY semester, course_code";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching courses:", err);
      return res.status(500).json({ error: "Failed to fetch courses" });
    }
    res.json(results);
  });
});

// Create new course
app.post("/courses", (req, res) => {
  const { course_code, course_name, subject, semester, academic_year, credits, instructor, schedule } = req.body;
  
  const sql = "INSERT INTO courses (course_code, course_name, subject, semester, academic_year, credits, instructor, schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [course_code, course_name, subject, semester, academic_year, credits, instructor, JSON.stringify(schedule)], (err, result) => {
    if (err) {
      console.error("Error creating course:", err);
      return res.status(500).json({ error: "Failed to create course" });
    }
    
    res.status(201).json({ 
      message: "Course created successfully", 
      courseId: result.insertId 
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("🤖 AI-powered student task planning enabled!");
  console.log("📚 Smart scheduling and Pomodoro timer available!");
  console.log("🎯 Academic workload optimization active!");
});
