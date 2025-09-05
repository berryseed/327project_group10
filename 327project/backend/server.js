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

// Authentication middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    // In production, verify JWT token here
    // For now, extract user ID from token (mock implementation)
    req.user = { id: 1 }; // This should be extracted from JWT
  }
  next();
});

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "berryseed",
  database: process.env.DB_NAME || "taskplanner"
});

// Initialize Task model
const taskModel = new Task(db);

// Notification scheduling function
async function scheduleDeadlineNotification(userId, taskId, deadline) {
  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    // Schedule notifications at different intervals before deadline
    const notificationTimes = [
      { hours: 24, message: 'Task due in 24 hours' },
      { hours: 2, message: 'Task due in 2 hours' },
      { hours: 0.5, message: 'Task due in 30 minutes' }
    ];
    
    for (const notif of notificationTimes) {
      const notifyAt = new Date(deadlineDate.getTime() - (notif.hours * 60 * 60 * 1000));
      
      // Only schedule if notification time is in the future
      if (notifyAt > now) {
        await taskModel.createNotification({
          user_id: userId,
          type: 'deadline_reminder',
          title: 'Deadline Reminder',
          message: notif.message,
          task_id: taskId,
          priority: notif.hours <= 2 ? 'high' : 'medium',
          scheduled_at: notifyAt.toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error scheduling deadline notification:', error);
  }
}

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
    
    // Start notification processor
    startNotificationProcessor();
  } catch (error) {
    console.error("❌ Error initializing tables:", error);
  }
});

// Notification processor - runs every minute
function startNotificationProcessor() {
  setInterval(async () => {
    try {
      // Get notifications that are due to be sent
      const sql = `
        SELECT * FROM notifications 
        WHERE scheduled_at IS NOT NULL 
        AND scheduled_at <= NOW() 
        AND sent_at IS NULL
        ORDER BY scheduled_at ASC
      `;
      
      const [notifications] = await db.promise().query(sql);
      
      for (const notification of notifications) {
        // Mark as sent
        await db.promise().query(
          'UPDATE notifications SET sent_at = NOW() WHERE id = ?',
          [notification.id]
        );
        
        console.log(`📧 Notification sent: ${notification.title} to user ${notification.user_id}`);
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  }, 60000); // Run every minute
  
  console.log("✅ Notification processor started");
}

// Default route (test)
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// ===== CORE TASK MANAGEMENT =====

// Get all tasks with enhanced student information
app.get("/tasks", async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Get from auth middleware or default
    const tasks = await taskModel.getAllTasks(userId);
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
    const userId = req.user?.id || 1;
    const newTask = await taskModel.createEnhancedTask(taskData, userId);
    
    // Schedule deadline notification
    if (taskData.deadline) {
      await scheduleDeadlineNotification(userId, newTask.id, taskData.deadline);
    }
    
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

// ===== AVAILABILITY & CLASS SCHEDULE MANAGEMENT =====

// Helper: validate 15-minute increments (HH:mm)
function isValidFifteenMinuteIncrement(timeStr) {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return false;
  return mm % 15 === 0;
}

// Time Blocks: list
app.get("/availability/blocks", async (req, res) => {
  try {
    const blocks = await taskModel.listTimeBlocks(1);
    res.json(blocks);
  } catch (error) {
    console.error("Error listing time blocks:", error);
    res.status(500).json({ error: "Failed to list time blocks" });
  }
});

// Time Blocks: create
app.post("/availability/blocks", async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, block_type, is_recurring, start_date, end_date } = req.body;
    if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ error: "day_of_week must be 0..6" });
    }
    if (!isValidFifteenMinuteIncrement(start_time) || !isValidFifteenMinuteIncrement(end_time)) {
      return res.status(400).json({ error: "Times must be in HH:mm and 15-minute increments" });
    }
    if (start_time >= end_time) {
      return res.status(400).json({ error: "start_time must be before end_time" });
    }
    const created = await taskModel.createTimeBlock({
      user_id: 1,
      day_of_week,
      start_time,
      end_time,
      block_type,
      is_recurring,
      source: 'user',
      start_date,
      end_date
    });
    res.status(201).json({ message: "Time block created", block: created });
  } catch (error) {
    console.error("Error creating time block:", error);
    res.status(500).json({ error: "Failed to create time block" });
  }
});

// Time Blocks: update
app.put("/availability/blocks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    if (updates.start_time && !isValidFifteenMinuteIncrement(updates.start_time)) {
      return res.status(400).json({ error: "start_time must be in 15-minute increments" });
    }
    if (updates.end_time && !isValidFifteenMinuteIncrement(updates.end_time)) {
      return res.status(400).json({ error: "end_time must be in 15-minute increments" });
    }
    if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
      return res.status(400).json({ error: "start_time must be before end_time" });
    }
    const success = await taskModel.updateTimeBlock(id, updates);
    if (!success) return res.status(404).json({ error: "Time block not found or no fields updated" });
    res.json({ message: "Time block updated" });
  } catch (error) {
    console.error("Error updating time block:", error);
    res.status(500).json({ error: "Failed to update time block" });
  }
});

// Time Blocks: delete
app.delete("/availability/blocks/:id", async (req, res) => {
  try {
    const success = await taskModel.deleteTimeBlock(req.params.id);
    if (!success) return res.status(404).json({ error: "Time block not found" });
    res.json({ message: "Time block deleted" });
  } catch (error) {
    console.error("Error deleting time block:", error);
    res.status(500).json({ error: "Failed to delete time block" });
  }
});

// Exceptions: list
app.get("/availability/exceptions", async (req, res) => {
  try {
    const { start, end } = req.query;
    const rows = await taskModel.listExceptions(1, { start, end });
    res.json(rows);
  } catch (error) {
    console.error("Error listing exceptions:", error);
    res.status(500).json({ error: "Failed to list exceptions" });
  }
});

// Exceptions: create
app.post("/availability/exceptions", async (req, res) => {
  try {
    const { date, start_time, end_time, block_type, reason } = req.body;
    if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
    if (!isValidFifteenMinuteIncrement(start_time) || !isValidFifteenMinuteIncrement(end_time)) {
      return res.status(400).json({ error: "Times must be in HH:mm and 15-minute increments" });
    }
    if (start_time >= end_time) {
      return res.status(400).json({ error: "start_time must be before end_time" });
    }
    const created = await taskModel.createException({ user_id: 1, date, start_time, end_time, block_type, reason });
    res.status(201).json({ message: "Exception created", exception: created });
  } catch (error) {
    console.error("Error creating exception:", error);
    res.status(500).json({ error: "Failed to create exception" });
  }
});

// Exceptions: delete
app.delete("/availability/exceptions/:id", async (req, res) => {
  try {
    const success = await taskModel.deleteException(req.params.id);
    if (!success) return res.status(404).json({ error: "Exception not found" });
    res.json({ message: "Exception deleted" });
  } catch (error) {
    console.error("Error deleting exception:", error);
    res.status(500).json({ error: "Failed to delete exception" });
  }
});

// Class schedule: list
app.get("/class-schedule", async (req, res) => {
  try {
    const rows = await taskModel.listClassSchedule(1);
    res.json(rows);
  } catch (error) {
    console.error("Error listing class schedule:", error);
    res.status(500).json({ error: "Failed to list class schedule" });
  }
});

// Class schedule: create
app.post("/class-schedule", async (req, res) => {
  try {
    const { course_code, day_of_week, start_time, end_time, location, recurring_start, recurring_end } = req.body;
    if (!course_code) return res.status(400).json({ error: "course_code is required" });
    if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ error: "day_of_week must be 0..6" });
    }
    if (!isValidFifteenMinuteIncrement(start_time) || !isValidFifteenMinuteIncrement(end_time)) {
      return res.status(400).json({ error: "Times must be in HH:mm and 15-minute increments" });
    }
    if (start_time >= end_time) {
      return res.status(400).json({ error: "start_time must be before end_time" });
    }
    const created = await taskModel.createClassSchedule({ user_id: 1, course_code, day_of_week, start_time, end_time, location, recurring_start, recurring_end });
    res.status(201).json({ message: "Class schedule created", entry: created });
  } catch (error) {
    console.error("Error creating class schedule:", error);
    res.status(500).json({ error: "Failed to create class schedule" });
  }
});

// Class schedule: delete
app.delete("/class-schedule/:id", async (req, res) => {
  try {
    const success = await taskModel.deleteClassSchedule(req.params.id);
    if (!success) return res.status(404).json({ error: "Class schedule not found" });
    res.json({ message: "Class schedule deleted" });
  } catch (error) {
    console.error("Error deleting class schedule:", error);
    res.status(500).json({ error: "Failed to delete class schedule" });
  }
});

// Schedule validation: detect conflicts and overcommitment
app.post("/scheduler/validate", async (req, res) => {
  try {
    const { candidateSchedule = [] } = req.body; // [{ date: 'YYYY-MM-DD', start: 'HH:mm', end: 'HH:mm', label }]
    // Load existing unavailable blocks
    const [blocks, exceptions, classes] = await Promise.all([
      taskModel.listTimeBlocks(1),
      taskModel.listExceptions(1, {}),
      taskModel.listClassSchedule(1)
    ]);

    // Build a set of daily unavailable intervals
    const conflicts = [];
    function toMinutes(t) { const [h, m] = t.split(':').map(x => parseInt(x, 10)); return h * 60 + m; }

    candidateSchedule.forEach(item => {
      const startMin = toMinutes(item.start);
      const endMin = toMinutes(item.end);
      if (startMin % 15 !== 0 || endMin % 15 !== 0) {
        conflicts.push({ item, reason: 'Not aligned to 15-minute increments' });
        return;
      }
      if (startMin >= endMin) {
        conflicts.push({ item, reason: 'Start must be before end' });
        return;
      }
      const date = new Date(item.date);
      const day = date.getDay();

      // Check recurring time_blocks marked unavailable
      blocks.filter(b => b.day_of_week === day && b.block_type === 'unavailable')
        .forEach(b => {
          if (toMinutes(b.start_time) < endMin && toMinutes(b.end_time) > startMin) {
            conflicts.push({ item, reason: 'Overlaps with unavailable time block' });
          }
        });

      // Check class schedule (implicitly unavailable)
      classes.filter(c => c.day_of_week === day)
        .forEach(c => {
          if (toMinutes(c.start_time) < endMin && toMinutes(c.end_time) > startMin) {
            conflicts.push({ item, reason: `Overlaps with class ${c.course_code}` });
          }
        });

      // Check date-specific exceptions (unavailable)
      exceptions.filter(e => e.date === item.date && e.block_type === 'unavailable')
        .forEach(e => {
          if (toMinutes(e.start_time) < endMin && toMinutes(e.end_time) > startMin) {
            conflicts.push({ item, reason: 'Overlaps with unavailable exception' });
          }
        });
    });

    // Basic overcommit warning: more than 8 hours scheduled in a day
    const dayTotals = {};
    candidateSchedule.forEach(i => {
      const key = i.date;
      dayTotals[key] = (dayTotals[key] || 0) + (toMinutes(i.end) - toMinutes(i.start));
    });
    const warnings = Object.entries(dayTotals)
      .filter(([, minutes]) => minutes > 8 * 60)
      .map(([date, minutes]) => ({ date, reason: `Overcommitted: ${Math.round(minutes/60)}h scheduled` }));

    res.json({ success: true, conflicts, warnings, suggestions: warnings.length > 0 ? ['Reduce daily load below 8 hours', 'Spread tasks across multiple days'] : [] });
  } catch (error) {
    console.error("Error validating schedule:", error);
    res.status(500).json({ error: "Failed to validate schedule" });
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
    const aiResponse = await aiService.planFullSchedule(userDescription, userPreferences, constraints);

    // If AI returned fallback text instead of JSON
    if (!aiResponse.success) {
      return res.status(500).json({ error: "AI output invalid", details: aiResponse.fallback });
    }

    const tasksFromAI = aiResponse.data.tasks || aiResponse.data;

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
      aiAnalysis: analysis.success ? analysis.data : analysis.fallback,
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

// List study sessions
app.get("/study-sessions", async (req, res) => {
  try {
    const sessions = await taskModel.listStudySessions(req.query);
    res.json(sessions);
  } catch (error) {
    console.error("Error listing study sessions:", error);
    res.status(500).json({ error: "Failed to list study sessions" });
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

// ===== NOTIFICATION SYSTEM =====

// Get all notifications
app.get("/notifications", async (req, res) => {
  try {
    const notifications = await taskModel.getAllNotifications(1);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
app.put("/notifications/:id/read", async (req, res) => {
  try {
    const success = await taskModel.markNotificationAsRead(req.params.id);
    if (success) {
      res.json({ message: "Notification marked as read" });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
app.put("/notifications/read-all", async (req, res) => {
  try {
    await taskModel.markAllNotificationsAsRead(1);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Delete notification
app.delete("/notifications/:id", async (req, res) => {
  try {
    const success = await taskModel.deleteNotification(req.params.id);
    if (success) {
      res.json({ message: "Notification deleted" });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Send test notification
app.post("/notifications/test", async (req, res) => {
  try {
    const notification = await taskModel.createNotification({
      user_id: 1,
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      priority: 'medium'
    });
    res.json({ message: "Test notification sent", notification });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

// Get notification settings
app.get("/notification-settings", async (req, res) => {
  try {
    const settings = await taskModel.getNotificationSettings(1);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch notification settings" });
  }
});

// Update notification settings
app.put("/notification-settings", async (req, res) => {
  try {
    const success = await taskModel.updateNotificationSettings(1, req.body);
    if (success) {
      res.json({ message: "Notification settings updated" });
    } else {
      res.status(404).json({ error: "Settings not found" });
    }
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
});

// ===== USER AUTHENTICATION =====

// Register user
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, studentId } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    const user = await taskModel.createUser({
      email,
      password,
      firstName,
      lastName,
      studentId
    });

    // Generate JWT token (simplified - in production use proper JWT)
    const token = `mock-jwt-token-${Date.now()}`;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await taskModel.authenticateUser(email, password);
    
    if (user) {
      // Generate JWT token (simplified - in production use proper JWT)
      const token = `mock-jwt-token-${Date.now()}`;
      
      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          lastLogin: new Date().toISOString()
        },
        token
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
app.get("/auth/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Mock user data (in production, verify JWT token)
    const user = await taskModel.getUserById(1);
    
    if (user) {
      res.json({ user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Update user profile
app.put("/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const success = await taskModel.updateUserProfile(1, req.body);
    
    if (success) {
      const user = await taskModel.getUserById(1);
      res.json({
        success: true,
        message: "Profile updated successfully",
        user
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Profile update failed" });
  }
});

// Forgot password
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Mock password reset (in production, send actual email)
    res.json({
      success: true,
      message: "Password reset email sent (mock)"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// Logout
app.post("/auth/logout", (req, res) => {
  // In production, invalidate the JWT token
  res.json({ message: "Logged out successfully" });
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
