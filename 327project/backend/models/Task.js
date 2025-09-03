const mysql = require('mysql2');

class Task {
  constructor(db) {
    this.db = db;
  }

  // Create tasks table with student-specific fields
  async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_type ENUM('assignment', 'exam', 'class', 'study', 'project', 'other') DEFAULT 'other',
        course_code VARCHAR(20),
        course_name VARCHAR(100),
        subject VARCHAR(50),
        semester VARCHAR(20),
        academic_year VARCHAR(10),
        deadline DATETIME,
        estimated_duration INT DEFAULT 60, -- in minutes
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('pending', 'in-progress', 'completed', 'overdue') DEFAULT 'pending',
        difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        study_blocks JSON, -- Array of study sessions
        ai_analysis JSON,
        tags JSON,
        attachments JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_course (course_code, semester),
        INDEX idx_deadline (deadline),
        INDEX idx_priority (priority),
        INDEX idx_status (status),
        INDEX idx_task_type (task_type)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Tasks table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating tasks table:', error);
      throw error;
    }
  }

  // Create courses table
  async createCoursesTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        subject VARCHAR(50),
        semester VARCHAR(20),
        academic_year VARCHAR(10),
        credits INT DEFAULT 3,
        instructor VARCHAR(100),
        schedule JSON, -- Class schedule with days and times
        syllabus_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Courses table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating courses table:', error);
      throw error;
    }
  }

  // Create study sessions table
  async createStudySessionsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        duration INT NOT NULL, -- in minutes
        session_type ENUM('pomodoro', 'study', 'break', 'review') DEFAULT 'study',
        productivity_score INT DEFAULT 0, -- 0-100
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_task (task_id),
        INDEX idx_time (start_time, end_time)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Study sessions table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating study sessions table:', error);
      throw error;
    }
  }

  // Create user preferences table
  async createUserPreferencesTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1, -- For single user system
        work_hours JSON, -- Preferred work hours
        study_blocks JSON, -- Preferred study block durations
        break_duration INT DEFAULT 15, -- Break duration in minutes
        pomodoro_duration INT DEFAULT 25, -- Pomodoro session duration
        preferred_days JSON, -- Preferred study days
        notification_settings JSON, -- Email, SMS, push notifications
        productivity_goals JSON, -- Daily/weekly goals
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ User preferences table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating user preferences table:', error);
      throw error;
    }
  }

  // Initialize all tables
  async initializeTables() {
    await this.createTable();
    await this.createCoursesTable();
    await this.createStudySessionsTable();
    await this.createUserPreferencesTable();
    
    // Insert default user preferences
    await this.insertDefaultPreferences();
  }

  // Insert default user preferences
  async insertDefaultPreferences() {
    const defaultPrefs = {
      work_hours: { start: '09:00', end: '17:00' },
      study_blocks: [25, 50, 90], // minutes
      break_duration: 15,
      pomodoro_duration: 25,
      preferred_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      notification_settings: { email: true, sms: false, push: true },
      productivity_goals: { daily_tasks: 5, weekly_hours: 30 }
    };

    const sql = `
      INSERT IGNORE INTO user_preferences (user_id, work_hours, study_blocks, break_duration, pomodoro_duration, preferred_days, notification_settings, productivity_goals)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      await this.db.promise().query(sql, [
        JSON.stringify(defaultPrefs.work_hours),
        JSON.stringify(defaultPrefs.study_blocks),
        defaultPrefs.break_duration,
        defaultPrefs.pomodoro_duration,
        JSON.stringify(defaultPrefs.preferred_days),
        JSON.stringify(defaultPrefs.notification_settings),
        JSON.stringify(defaultPrefs.productivity_goals)
      ]);
      console.log('✅ Default user preferences inserted');
    } catch (error) {
      console.error('❌ Error inserting default preferences:', error);
    }
  }

  // Get all tasks with enhanced student information
  async getAllTasks() {
    const sql = `
      SELECT t.*, 
             c.course_name, c.subject, c.instructor,
             COUNT(ss.id) as study_sessions_count,
             SUM(ss.duration) as total_study_time
      FROM tasks t
      LEFT JOIN courses c ON t.course_code = c.course_code
      LEFT JOIN study_sessions ss ON t.id = ss.task_id
      GROUP BY t.id
      ORDER BY t.deadline ASC, t.priority DESC
    `;

    try {
      const [rows] = await this.db.promise().query(sql);
      return rows;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Get tasks by course
  async getTasksByCourse(courseCode) {
    const sql = `
      SELECT * FROM tasks 
      WHERE course_code = ? 
      ORDER BY deadline ASC, priority DESC
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [courseCode]);
      return rows;
    } catch (error) {
      console.error('Error fetching tasks by course:', error);
      throw error;
    }
  }

  // Get upcoming deadlines
  async getUpcomingDeadlines(days = 7) {
    const sql = `
      SELECT * FROM tasks 
      WHERE deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
      AND status != 'completed'
      ORDER BY deadline ASC
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [days]);
      return rows;
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      throw error;
    }
  }

  // Get study statistics
  async getStudyStatistics(days = 30) {
    const sql = `
      SELECT 
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_tasks,
        SUM(ss.duration) as total_study_time,
        AVG(ss.productivity_score) as avg_productivity,
        COUNT(ss.id) as total_sessions
      FROM tasks t
      LEFT JOIN study_sessions ss ON t.id = ss.task_id 
        AND ss.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [days, days]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching study statistics:', error);
      throw error;
    }
  }

  // Create enhanced task with student-specific fields
  async createEnhancedTask(taskData) {
    const sql = `
      INSERT INTO tasks (
        title, description, task_type, course_code, course_name, subject,
        semester, academic_year, deadline, estimated_duration, priority,
        difficulty_level, tags, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      taskData.title,
      taskData.description,
      taskData.task_type || 'other',
      taskData.course_code,
      taskData.course_name,
      taskData.subject,
      taskData.semester,
      taskData.academic_year,
      taskData.deadline,
      taskData.estimated_duration || 60,
      taskData.priority || 'medium',
      taskData.difficulty_level || 'medium',
      JSON.stringify(taskData.tags || []),
      taskData.notes
    ];

    try {
      const [result] = await this.db.promise().query(sql, values);
      return { id: result.insertId, ...taskData };
    } catch (error) {
      console.error('Error creating enhanced task:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(taskId, status) {
    const sql = `
      UPDATE tasks 
      SET status = ?, 
          updated_at = NOW(),
          completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = ?
    `;

    try {
      const [result] = await this.db.promise().query(sql, [status, status, taskId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Record study session
  async recordStudySession(sessionData) {
    const sql = `
      INSERT INTO study_sessions (
        task_id, start_time, end_time, duration, session_type, productivity_score, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      sessionData.task_id,
      sessionData.start_time,
      sessionData.end_time,
      sessionData.duration,
      sessionData.session_type || 'study',
      sessionData.productivity_score || 0,
      sessionData.notes
    ];

    try {
      const [result] = await this.db.promise().query(sql, values);
      return { id: result.insertId, ...sessionData };
    } catch (error) {
      console.error('Error recording study session:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId = 1) {
    const sql = `SELECT * FROM user_preferences WHERE user_id = ?`;

    try {
      const [rows] = await this.db.promise().query(sql, [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    const sql = `
      UPDATE user_preferences 
      SET work_hours = ?, study_blocks = ?, break_duration = ?, 
          pomodoro_duration = ?, preferred_days = ?, 
          notification_settings = ?, productivity_goals = ?,
          updated_at = NOW()
      WHERE user_id = ?
    `;

    const values = [
      JSON.stringify(preferences.work_hours),
      JSON.stringify(preferences.study_blocks),
      preferences.break_duration,
      preferences.pomodoro_duration,
      JSON.stringify(preferences.preferred_days),
      JSON.stringify(preferences.notification_settings),
      JSON.stringify(preferences.productivity_goals),
      userId
    ];

    try {
      const [result] = await this.db.promise().query(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}

module.exports = Task;

