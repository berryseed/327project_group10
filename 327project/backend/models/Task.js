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

  // Create users table
  async createUsersTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Users table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating users table:', error);
      throw error;
    }
  }

  // Create notifications table
  async createNotificationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('deadline_reminder', 'overdue_alert', 'study_reminder', 'daily_summary', 'weekly_report', 'test') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        task_id INT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_type (type),
        INDEX idx_priority (priority),
        INDEX idx_read_status (read_status)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Notifications table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating notifications table:', error);
      throw error;
    }
  }

  // Initialize all tables
  async initializeTables() {
    await this.createTable();
    await this.createCoursesTable();
    await this.createStudySessionsTable();
    await this.createUserPreferencesTable();
    await this.createTimeBlocksTable();
    await this.createAvailabilityExceptionsTable();
    await this.createClassScheduleTable();
    await this.createUsersTable();
    await this.createNotificationsTable();
    
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

  // Create time blocks table (weekly availability with 15-min increments)
  async createTimeBlocksTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS time_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        day_of_week TINYINT NOT NULL, -- 0=Sunday .. 6=Saturday
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        block_type ENUM('preferred','available','unavailable') DEFAULT 'available',
        is_recurring TINYINT(1) DEFAULT 1,
        source ENUM('user','class','exception') DEFAULT 'user',
        start_date DATE NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_day (user_id, day_of_week),
        INDEX idx_time (start_time, end_time)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Time blocks table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating time blocks table:', error);
      throw error;
    }
  }

  // Create availability exceptions table (one-time overrides)
  async createAvailabilityExceptionsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS availability_exceptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        block_type ENUM('preferred','available','unavailable') DEFAULT 'unavailable',
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, date)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Availability exceptions table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating availability exceptions table:', error);
      throw error;
    }
  }

  // Create class schedule table (class times auto-marked as unavailable)
  async createClassScheduleTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS class_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        course_code VARCHAR(20) NOT NULL,
        day_of_week TINYINT NOT NULL, -- 0..6
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(100),
        recurring_start DATE NULL,
        recurring_end DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_day (user_id, day_of_week),
        INDEX idx_course (course_code)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Class schedule table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating class schedule table:', error);
      throw error;
    }
  }

  // Basic users table (for future authentication)
  async createUsersTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Users table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating users table:', error);
      throw error;
    }
  }

  // Notifications table (scheduled alerts)
  async createNotificationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        type ENUM('deadline','session_reminder','overdue','daily_summary','weekly_report') NOT NULL,
        payload JSON,
        scheduled_at DATETIME,
        sent_at DATETIME NULL,
        status ENUM('scheduled','sent','failed','cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_time (user_id, scheduled_at),
        INDEX idx_status (status)
      )
    `;

    try {
      await this.db.promise().query(sql);
      console.log('✅ Notifications table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating notifications table:', error);
      throw error;
    }
  }

  // ===== Availability CRUD =====
  async listTimeBlocks(userId = 1) {
    const [rows] = await this.db.promise().query(
      `SELECT * FROM time_blocks WHERE user_id = ? ORDER BY day_of_week, start_time`,
      [userId]
    );
    return rows;
  }

  async createTimeBlock(block) {
    const sql = `
      INSERT INTO time_blocks (user_id, day_of_week, start_time, end_time, block_type, is_recurring, source, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      block.user_id || 1,
      block.day_of_week,
      block.start_time,
      block.end_time,
      block.block_type || 'available',
      block.is_recurring ? 1 : 0,
      block.source || 'user',
      block.start_date || null,
      block.end_date || null
    ];
    const [result] = await this.db.promise().query(sql, values);
    return { id: result.insertId, ...block };
  }

  async updateTimeBlock(id, updates) {
    const fields = [];
    const values = [];
    const allowed = ['day_of_week','start_time','end_time','block_type','is_recurring','start_date','end_date'];
    allowed.forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    if (fields.length === 0) return false;
    values.push(id);
    const [res] = await this.db.promise().query(`UPDATE time_blocks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    return res.affectedRows > 0;
  }

  async deleteTimeBlock(id) {
    const [res] = await this.db.promise().query(`DELETE FROM time_blocks WHERE id = ?`, [id]);
    return res.affectedRows > 0;
  }

  // Exceptions CRUD
  async listExceptions(userId = 1, dateRange = {}) {
    const conditions = ['user_id = ?'];
    const params = [userId];
    if (dateRange.start) { conditions.push('date >= ?'); params.push(dateRange.start); }
    if (dateRange.end) { conditions.push('date <= ?'); params.push(dateRange.end); }
    const [rows] = await this.db.promise().query(`SELECT * FROM availability_exceptions WHERE ${conditions.join(' AND ')} ORDER BY date, start_time`, params);
    return rows;
  }

  async createException(exception) {
    const sql = `
      INSERT INTO availability_exceptions (user_id, date, start_time, end_time, block_type, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [exception.user_id || 1, exception.date, exception.start_time, exception.end_time, exception.block_type || 'unavailable', exception.reason || null];
    const [result] = await this.db.promise().query(sql, values);
    // Also mirror to time_blocks as a non-recurring block for that specific date if needed by scheduler
    return { id: result.insertId, ...exception };
  }

  async deleteException(id) {
    const [res] = await this.db.promise().query(`DELETE FROM availability_exceptions WHERE id = ?`, [id]);
    return res.affectedRows > 0;
  }

  // Class schedule CRUD and integration
  async listClassSchedule(userId = 1) {
    const [rows] = await this.db.promise().query(`SELECT * FROM class_schedule WHERE user_id = ? ORDER BY day_of_week, start_time`, [userId]);
    return rows;
  }

  async createClassSchedule(entry) {
    const sql = `
      INSERT INTO class_schedule (user_id, course_code, day_of_week, start_time, end_time, location, recurring_start, recurring_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [entry.user_id || 1, entry.course_code, entry.day_of_week, entry.start_time, entry.end_time, entry.location || null, entry.recurring_start || null, entry.recurring_end || null];
    const [result] = await this.db.promise().query(sql, values);

    // Automatically create an unavailable time block for this class window
    await this.createTimeBlock({
      user_id: entry.user_id || 1,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      block_type: 'unavailable',
      is_recurring: 1,
      source: 'class',
      start_date: entry.recurring_start || null,
      end_date: entry.recurring_end || null
    });

    return { id: result.insertId, ...entry };
  }

  async deleteClassSchedule(id) {
    // Delete schedule
    const [res] = await this.db.promise().query(`DELETE FROM class_schedule WHERE id = ?`, [id]);
    return res.affectedRows > 0;
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

  // List study sessions with optional filters
  async listStudySessions({ task_id, days } = {}) {
    const conditions = [];
    const values = [];
    let sql = `
      SELECT 
        ss.id, ss.task_id, ss.start_time, ss.end_time, ss.duration, ss.session_type, ss.productivity_score, ss.notes,
        t.title as task_title
      FROM study_sessions ss
      LEFT JOIN tasks t ON t.id = ss.task_id
    `;
    if (task_id) {
      conditions.push('ss.task_id = ?');
      values.push(task_id);
    }
    if (days) {
      conditions.push('ss.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      values.push(parseInt(days, 10));
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY ss.start_time DESC';

    try {
      const [rows] = await this.db.promise().query(sql, values);
      return rows;
    } catch (error) {
      console.error('Error listing study sessions:', error);
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

  // ===== NOTIFICATION METHODS =====

  // Create notification
  async createNotification(notificationData) {
    const sql = `
      INSERT INTO notifications (user_id, type, title, message, priority, task_id, read_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      notificationData.user_id,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.priority,
      notificationData.task_id || null,
      false
    ];

    try {
      const [result] = await this.db.promise().query(sql, values);
      return { id: result.insertId, ...notificationData };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get all notifications for user
  async getAllNotifications(userId) {
    const sql = `
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [userId]);
      return rows;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    const sql = `
      UPDATE notifications 
      SET read_status = true, updated_at = NOW()
      WHERE id = ?
    `;

    try {
      const [result] = await this.db.promise().query(sql, [notificationId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    const sql = `
      UPDATE notifications 
      SET read_status = true, updated_at = NOW()
      WHERE user_id = ? AND read_status = false
    `;

    try {
      const [result] = await this.db.promise().query(sql, [userId]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    const sql = `DELETE FROM notifications WHERE id = ?`;

    try {
      const [result] = await this.db.promise().query(sql, [notificationId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification settings
  async getNotificationSettings(userId) {
    const sql = `
      SELECT notification_settings FROM user_preferences 
      WHERE user_id = ?
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [userId]);
      if (rows.length > 0) {
        return JSON.parse(rows[0].notification_settings);
      }
      return null;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId, settings) {
    const sql = `
      UPDATE user_preferences 
      SET notification_settings = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    try {
      const [result] = await this.db.promise().query(sql, [JSON.stringify(settings), userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // ===== USER AUTHENTICATION METHODS =====

  // Create user
  async createUser(userData) {
    const sql = `
      INSERT INTO users (email, password, first_name, last_name, student_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      userData.email,
      userData.password, // In production, hash this password
      userData.firstName,
      userData.lastName,
      userData.studentId || null
    ];

    try {
      const [result] = await this.db.promise().query(sql, values);
      return {
        id: result.insertId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        studentId: userData.studentId,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Authenticate user
  async authenticateUser(email, password) {
    const sql = `
      SELECT id, email, first_name, last_name, student_id, created_at
      FROM users 
      WHERE email = ? AND password = ?
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [email, password]);
      if (rows.length > 0) {
        return {
          id: rows[0].id,
          email: rows[0].email,
          firstName: rows[0].first_name,
          lastName: rows[0].last_name,
          studentId: rows[0].student_id,
          createdAt: rows[0].created_at
        };
      }
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    const sql = `
      SELECT id, email, first_name, last_name, student_id, created_at
      FROM users 
      WHERE id = ?
    `;

    try {
      const [rows] = await this.db.promise().query(sql, [userId]);
      if (rows.length > 0) {
        return {
          id: rows[0].id,
          email: rows[0].email,
          firstName: rows[0].first_name,
          lastName: rows[0].last_name,
          studentId: rows[0].student_id,
          createdAt: rows[0].created_at
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    const updates = [];
    const values = [];

    if (profileData.firstName) {
      updates.push('first_name = ?');
      values.push(profileData.firstName);
    }
    if (profileData.lastName) {
      updates.push('last_name = ?');
      values.push(profileData.lastName);
    }
    if (profileData.studentId !== undefined) {
      updates.push('student_id = ?');
      values.push(profileData.studentId);
    }
    if (profileData.password) {
      updates.push('password = ?');
      values.push(profileData.password); // In production, hash this password
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    try {
      const [result] = await this.db.promise().query(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

module.exports = Task;

