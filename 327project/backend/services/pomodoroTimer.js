const moment = require('moment');

class PomodoroTimer {
  constructor() {
    this.activeSessions = new Map(); // Track active sessions
    this.sessionHistory = []; // Store completed sessions
  }

  /**
   * Start a new Pomodoro session
   */
  startSession(sessionData) {
    try {
      const sessionId = this.generateSessionId();
      const now = moment();
      
      const session = {
        id: sessionId,
        taskId: sessionData.taskId,
        taskTitle: sessionData.taskTitle,
        sessionType: sessionData.sessionType || 'pomodoro',
        duration: sessionData.duration || 25, // Default 25 minutes
        startTime: now.toISOString(),
        estimatedEndTime: now.add(sessionData.duration || 25, 'minutes').toISOString(),
        status: 'active',
        breaks: [],
        productivityScore: 0,
        notes: sessionData.notes || '',
        createdAt: now.toISOString()
      };

      this.activeSessions.set(sessionId, session);

      return {
        success: true,
        session: session,
        message: `${session.sessionType} session started for ${session.duration} minutes`
      };
    } catch (error) {
      console.error('Error starting Pomodoro session:', error);
      return {
        success: false,
        error: 'Failed to start session'
      };
    }
  }

  /**
   * Pause a Pomodoro session
   */
  pauseSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Session is not active'
        };
      }

      session.status = 'paused';
      session.pausedAt = moment().toISOString();
      session.pauseDuration = session.pauseDuration || 0;

      return {
        success: true,
        session: session,
        message: 'Session paused'
      };
    } catch (error) {
      console.error('Error pausing session:', error);
      return {
        success: false,
        error: 'Failed to pause session'
      };
    }
  }

  /**
   * Resume a paused Pomodoro session
   */
  resumeSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (session.status !== 'paused') {
        return {
          success: false,
          error: 'Session is not paused'
        };
      }

      const now = moment();
      const pauseDuration = moment.duration(now.diff(moment(session.pausedAt)));
      session.pauseDuration = (session.pauseDuration || 0) + pauseDuration.asMinutes();
      
      // Adjust estimated end time
      session.estimatedEndTime = moment(now).add(session.duration, 'minutes').toISOString();
      
      session.status = 'active';
      delete session.pausedAt;

      return {
        success: true,
        session: session,
        message: 'Session resumed'
      };
    } catch (error) {
      console.error('Error resuming session:', error);
      return {
        success: false,
        error: 'Failed to resume session'
      };
    }
  }

  /**
   * Complete a Pomodoro session
   */
  completeSession(sessionId, completionData = {}) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      const now = moment();
      const actualDuration = moment.duration(now.diff(moment(session.startTime)));
      
      // Calculate actual session duration (excluding pause time)
      const actualSessionDuration = actualDuration.asMinutes() - (session.pauseDuration || 0);
      
      const completedSession = {
        ...session,
        status: 'completed',
        endTime: now.toISOString(),
        actualDuration: Math.round(actualSessionDuration),
        totalDuration: Math.round(actualDuration.asMinutes()),
        pauseDuration: session.pauseDuration || 0,
        productivityScore: completionData.productivityScore || this.calculateProductivityScore(session, actualSessionDuration),
        notes: completionData.notes || session.notes,
        completedAt: now.toISOString()
      };

      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      
      // Add to history
      this.sessionHistory.push(completedSession);

      return {
        success: true,
        session: completedSession,
        message: 'Session completed successfully'
      };
    } catch (error) {
      console.error('Error completing session:', error);
      return {
        success: false,
        error: 'Failed to complete session'
      };
    }
  }

  /**
   * Take a break during a session
   */
  takeBreak(sessionId, breakData = {}) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Session is not active'
        };
      }

      const breakInfo = {
        startTime: moment().toISOString(),
        duration: breakData.duration || 5, // Default 5 minute break
        type: breakData.type || 'short', // short, long, or custom
        reason: breakData.reason || 'Scheduled break'
      };

      session.breaks.push(breakInfo);
      session.status = 'break';

      return {
        success: true,
        session: session,
        break: breakInfo,
        message: `Break started for ${breakInfo.duration} minutes`
      };
    } catch (error) {
      console.error('Error taking break:', error);
      return {
        success: false,
        error: 'Failed to start break'
      };
    }
  }

  /**
   * End break and resume session
   */
  endBreak(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (session.status !== 'break') {
        return {
          success: false,
          error: 'Session is not on break'
        };
      }

      const currentBreak = session.breaks[session.breaks.length - 1];
      currentBreak.endTime = moment().toISOString();
      
      session.status = 'active';

      return {
        success: true,
        session: session,
        message: 'Break ended, session resumed'
      };
    } catch (error) {
      console.error('Error ending break:', error);
      return {
        success: false,
        error: 'Failed to end break'
      };
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get session history
   */
  getSessionHistory(filters = {}) {
    let filteredHistory = [...this.sessionHistory];

    // Filter by date range
    if (filters.startDate) {
      filteredHistory = filteredHistory.filter(session => 
        moment(session.startTime).isAfter(moment(filters.startDate))
      );
    }

    if (filters.endDate) {
      filteredHistory = filteredHistory.filter(session => 
        moment(session.startTime).isBefore(moment(filters.endDate))
      );
    }

    // Filter by task
    if (filters.taskId) {
      filteredHistory = filteredHistory.filter(session => 
        session.taskId === filters.taskId
      );
    }

    // Filter by session type
    if (filters.sessionType) {
      filteredHistory = filteredHistory.filter(session => 
        session.sessionType === filters.sessionType
      );
    }

    // Sort by start time (newest first)
    filteredHistory.sort((a, b) => moment(b.startTime).diff(moment(a.startTime)));

    return filteredHistory;
  }

  /**
   * Get productivity analytics
   */
  getProductivityAnalytics(days = 30) {
    try {
      const cutoffDate = moment().subtract(days, 'days');
      const recentSessions = this.sessionHistory.filter(session => 
        moment(session.startTime).isAfter(cutoffDate)
      );

      if (recentSessions.length === 0) {
        return {
          success: true,
          analytics: {
            totalSessions: 0,
            totalStudyTime: 0,
            averageSessionLength: 0,
            averageProductivity: 0,
            completionRate: 0,
            breakEfficiency: 0,
            dailyTrends: [],
            taskPerformance: {}
          }
        };
      }

      const analytics = {
        totalSessions: recentSessions.length,
        totalStudyTime: recentSessions.reduce((sum, session) => sum + (session.actualDuration || 0), 0),
        averageSessionLength: Math.round(
          recentSessions.reduce((sum, session) => sum + (session.actualDuration || 0), 0) / recentSessions.length
        ),
        averageProductivity: Math.round(
          recentSessions.reduce((sum, session) => sum + (session.productivityScore || 0), 0) / recentSessions.length
        ),
        completionRate: Math.round(
          (recentSessions.filter(session => session.status === 'completed').length / recentSessions.length) * 100
        ),
        breakEfficiency: this.calculateBreakEfficiency(recentSessions),
        dailyTrends: this.calculateDailyTrends(recentSessions, days),
        taskPerformance: this.calculateTaskPerformance(recentSessions)
      };

      return {
        success: true,
        analytics: analytics
      };
    } catch (error) {
      console.error('Error calculating productivity analytics:', error);
      return {
        success: false,
        error: 'Failed to calculate analytics'
      };
    }
  }

  /**
   * Calculate break efficiency
   */
  calculateBreakEfficiency(sessions) {
    const sessionsWithBreaks = sessions.filter(session => session.breaks && session.breaks.length > 0);
    
    if (sessionsWithBreaks.length === 0) {
      return 100; // No breaks means 100% efficiency
    }

    let totalBreakTime = 0;
    let totalScheduledBreakTime = 0;

    sessionsWithBreaks.forEach(session => {
      session.breaks.forEach(breakInfo => {
        const breakDuration = breakInfo.duration || 0;
        totalScheduledBreakTime += breakDuration;
        
        if (breakInfo.endTime) {
          const actualBreakDuration = moment.duration(
            moment(breakInfo.endTime).diff(moment(breakInfo.startTime))
          ).asMinutes();
          totalBreakTime += actualBreakDuration;
        }
      });
    });

    if (totalScheduledBreakTime === 0) {
      return 100;
    }

    // Efficiency is how close actual break time is to scheduled break time
    const efficiency = Math.max(0, 100 - Math.abs(totalBreakTime - totalScheduledBreakTime) / totalScheduledBreakTime * 100);
    return Math.round(efficiency);
  }

  /**
   * Calculate daily trends
   */
  calculateDailyTrends(sessions, days) {
    const trends = [];
    const cutoffDate = moment().subtract(days, 'days');

    for (let i = 0; i < days; i++) {
      const targetDate = moment(cutoffDate).add(i, 'days');
      const daySessions = sessions.filter(session => 
        moment(session.startTime).isSame(targetDate, 'day')
      );

      const dayData = {
        date: targetDate.format('YYYY-MM-DD'),
        day: targetDate.format('dddd'),
        sessions: daySessions.length,
        studyTime: daySessions.reduce((sum, session) => sum + (session.actualDuration || 0), 0),
        productivity: daySessions.length > 0 ? 
          Math.round(daySessions.reduce((sum, session) => sum + (session.productivityScore || 0), 0) / daySessions.length) : 0
      };

      trends.push(dayData);
    }

    return trends;
  }

  /**
   * Calculate task performance
   */
  calculateTaskPerformance(sessions) {
    const taskPerformance = {};

    sessions.forEach(session => {
      if (!session.taskId) return;

      if (!taskPerformance[session.taskId]) {
        taskPerformance[session.taskId] = {
          taskTitle: session.taskTitle,
          totalSessions: 0,
          totalStudyTime: 0,
          averageProductivity: 0,
          completionRate: 0
        };
      }

      const task = taskPerformance[session.taskId];
      task.totalSessions++;
      task.totalStudyTime += session.actualDuration || 0;
      task.averageProductivity += session.productivityScore || 0;
      
      if (session.status === 'completed') {
        task.completionRate++;
      }
    });

    // Calculate averages
    Object.values(taskPerformance).forEach(task => {
      task.averageProductivity = Math.round(task.averageProductivity / task.totalSessions);
      task.completionRate = Math.round((task.completionRate / task.totalSessions) * 100);
    });

    return taskPerformance;
  }

  /**
   * Calculate productivity score based on session data
   */
  calculateProductivityScore(session, actualDuration) {
    let score = 50; // Base score

    // Duration efficiency (how close actual is to planned)
    const durationEfficiency = Math.min(actualDuration / session.duration, 1);
    score += durationEfficiency * 20;

    // Break efficiency
    const breakCount = session.breaks ? session.breaks.length : 0;
    if (breakCount === 0) {
      score += 10; // No breaks during short sessions is good
    } else if (breakCount <= 2) {
      score += 5; // Reasonable number of breaks
    } else {
      score -= 10; // Too many breaks
    }

    // Time of day bonus (morning sessions get bonus)
    const startHour = moment(session.startTime).hour();
    if (startHour >= 6 && startHour <= 10) {
      score += 10; // Morning bonus
    } else if (startHour >= 22 || startHour <= 2) {
      score -= 10; // Late night penalty
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recommended break duration
   */
  getRecommendedBreakDuration(sessionDuration, sessionType = 'pomodoro') {
    if (sessionType === 'pomodoro') {
      if (sessionDuration <= 25) {
        return 5; // 5 minute break for standard Pomodoro
      } else if (sessionDuration <= 50) {
        return 10; // 10 minute break for longer sessions
      } else {
        return 15; // 15 minute break for extended sessions
      }
    } else if (sessionType === 'study') {
      return Math.max(5, Math.floor(sessionDuration / 60) * 10); // 10 min per hour
    }
    
    return 5; // Default break duration
  }

  /**
   * Get study session recommendations
   */
  getStudyRecommendations() {
    const recommendations = [
      "🍅 Use the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break",
      "⏰ Take longer breaks (15-30 minutes) after every 4 Pomodoro sessions",
      "📚 Schedule difficult subjects during your most productive hours",
      "💧 Stay hydrated and take short breaks to maintain focus",
      "🎯 Set clear goals for each study session",
      "📱 Eliminate distractions during study sessions",
      "📊 Track your productivity to identify optimal study patterns",
      "🔄 Vary your study techniques to maintain engagement"
    ];

    return recommendations;
  }
}

module.exports = new PomodoroTimer();

