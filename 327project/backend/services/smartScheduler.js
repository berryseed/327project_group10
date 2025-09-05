const moment = require('moment');

class SmartScheduler {
  constructor() {
    this.weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  }

  /**
   * Generate smart time slot recommendations for academic tasks
   */
  async generateTimeSlots(tasks, userPreferences, availableTime = {}) {
    try {
      const slots = [];
      const { work_hours, study_blocks, break_duration, preferred_days } = userPreferences;
      
      // Parse work hours
      const startHour = parseInt(work_hours.start.split(':')[0]);
      const endHour = parseInt(work_hours.end.split(':')[0]);
      
      // Get current date and next 7 days
      const currentDate = moment();
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDate = moment(currentDate).add(dayOffset, 'days');
        const dayName = this.weekDays[targetDate.day()].toLowerCase();
        
        // Check if this is a preferred study day
        if (!preferred_days.includes(dayName)) {
          continue;
        }
        
        // Generate time slots for this day
        const daySlots = this.generateDaySlots(
          targetDate, 
          startHour, 
          endHour, 
          study_blocks, 
          break_duration,
          availableTime[dayName] || []
        );
        
        slots.push({
          date: targetDate.format('YYYY-MM-DD'),
          day: dayName,
          slots: daySlots
        });
      }
      
      return {
        success: true,
        timeSlots: slots,
        recommendations: this.generateSchedulingRecommendations(tasks, slots)
      };
    } catch (error) {
      console.error('Error generating time slots:', error);
      return {
        success: false,
        error: 'Failed to generate time slots',
        fallback: this.getFallbackTimeSlots()
      };
    }
  }

  /**
   * Generate time slots for a specific day
   */
  generateDaySlots(date, startHour, endHour, studyBlocks, breakDuration, unavailableTime = []) {
    const slots = [];
    let currentTime = moment(date).hour(startHour).minute(0);
    const endTime = moment(date).hour(endHour).minute(0);
    
    while (currentTime.isBefore(endTime)) {
      // Check if current time is unavailable
      if (this.isTimeUnavailable(currentTime, unavailableTime)) {
        currentTime.add(30, 'minutes');
        continue;
      }
      
      // Generate study blocks
      for (const blockDuration of studyBlocks) {
        const slotEnd = moment(currentTime).add(blockDuration, 'minutes');
        
        if (slotEnd.isAfter(endTime)) {
          break;
        }
        
        slots.push({
          start_time: currentTime.format('HH:mm'),
          end_time: slotEnd.format('HH:mm'),
          duration: blockDuration,
          type: 'study',
          available: true
        });
        
        // Add break time
        if (breakDuration > 0) {
          const breakStart = moment(slotEnd);
          const breakEnd = moment(breakStart).add(breakDuration, 'minutes');
          
          if (breakEnd.isBefore(endTime)) {
            slots.push({
              start_time: breakStart.format('HH:mm'),
              end_time: breakEnd.format('HH:mm'),
              duration: breakDuration,
              type: 'break',
              available: false
            });
            
            currentTime = moment(breakEnd);
          } else {
            currentTime = moment(slotEnd);
          }
        } else {
          currentTime = moment(slotEnd);
        }
      }
    }
    
    return slots;
  }

  /**
   * Check if a time is unavailable
   */
  isTimeUnavailable(time, unavailableTime) {
    return unavailableTime.some(unavailable => {
      const start = moment(unavailable.start, 'HH:mm');
      const end = moment(unavailable.end, 'HH:mm');
      return time.isBetween(start, end, null, '[]');
    });
  }

  /**
   * Generate intelligent scheduling recommendations
   */
  generateSchedulingRecommendations(tasks, timeSlots) {
    const recommendations = {
      highPriorityTasks: [],
      optimalStudyTimes: [],
      workloadDistribution: {},
      studyTips: []
    };
    
    // Sort tasks by priority and deadline
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return moment(a.deadline).diff(moment(b.deadline));
    });
    
    // Recommend high priority tasks for optimal time slots
    const optimalSlots = timeSlots.flatMap(day => 
      day.slots.filter(slot => slot.type === 'study' && slot.available)
    );
    
    sortedTasks.slice(0, Math.min(5, sortedTasks.length)).forEach((task, index) => {
      if (index < optimalSlots.length) {
        recommendations.highPriorityTasks.push({
          task: task.title,
          recommendedSlot: optimalSlots[index],
          reasoning: `High priority task scheduled during optimal study time`
        });
      }
    });
    
    // Generate workload distribution
    timeSlots.forEach(day => {
      const studySlots = day.slots.filter(slot => slot.type === 'study' && slot.available);
      const totalStudyTime = studySlots.reduce((sum, slot) => sum + slot.duration, 0);
      
      recommendations.workloadDistribution[day.day] = {
        availableSlots: studySlots.length,
        totalStudyTime: totalStudyTime,
        efficiency: this.calculateEfficiency(totalStudyTime, day.day)
      };
    });
    
    // Generate study tips
    recommendations.studyTips = this.generateStudyTips(tasks, timeSlots);
    
    return recommendations;
  }

  /**
   * Calculate study efficiency for a day
   */
  calculateEfficiency(studyTime, dayName) {
    const baseEfficiency = {
      monday: 0.9, tuesday: 0.95, wednesday: 0.9, 
      thursday: 0.85, friday: 0.8, saturday: 0.7, sunday: 0.6
    };
    
    const dayEfficiency = baseEfficiency[dayName] || 0.8;
    const timeEfficiency = Math.min(studyTime / 480, 1); // 8 hours max
    
    return Math.round((dayEfficiency * timeEfficiency) * 100);
  }

  /**
   * Generate personalized study tips
   */
  generateStudyTips(tasks, timeSlots) {
    const tips = [];
    
    // Analyze task distribution
    const taskTypes = tasks.reduce((acc, task) => {
      acc[task.task_type] = (acc[task.task_type] || 0) + 1;
      return acc;
    }, {});
    
    // Analyze deadlines and priorities
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const upcomingDeadlines = tasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && daysUntil >= 0;
    });
    
    // Tip based on task types
    if (taskTypes.exam > 0) {
      tips.push("📚 Schedule exam preparation during your most productive hours (usually morning)");
      tips.push("🧠 Use active recall techniques - test yourself instead of just re-reading");
      tips.push("📝 Create summary sheets for each subject to review before exams");
    }
    
    if (taskTypes.assignment > 0) {
      tips.push("✍️ Break down large assignments into smaller, manageable chunks");
      tips.push("📋 Start with the hardest parts first when your energy is highest");
      tips.push("⏰ Set mini-deadlines for each section to stay on track");
    }
    
    if (taskTypes.project > 0) {
      tips.push("🎯 Allocate longer study blocks (2-3 hours) for complex projects");
      tips.push("🔄 Plan regular progress reviews to catch issues early");
      tips.push("📊 Create a project timeline with clear milestones");
    }
    
    // Tip based on urgency
    if (urgentTasks.length > 2) {
      tips.push("🚨 You have multiple urgent tasks - prioritize by deadline and impact");
      tips.push("💪 Consider asking for extensions on lower-priority items if needed");
    }
    
    if (upcomingDeadlines.length > 0) {
      tips.push(`⏰ ${upcomingDeadlines.length} deadline(s) approaching - focus on these first`);
      tips.push("🎯 Use the Pomodoro technique (25 min work, 5 min break) for intense focus");
    }
    
    // Tip based on time slots
    const morningSlots = timeSlots.flatMap(day => 
      day.slots.filter(slot => 
        slot.type === 'study' && 
        slot.available && 
        parseInt(slot.start_time.split(':')[0]) < 12
      )
    );
    
    if (morningSlots.length > 0) {
      tips.push("🌅 Use morning slots for difficult subjects when your mind is fresh");
      tips.push("☀️ Morning study sessions are typically 40% more productive");
    }
    
    // Tip based on workload
    const totalStudyTime = timeSlots.flatMap(day => day.slots)
      .filter(slot => slot.type === 'study' && slot.available)
      .reduce((sum, slot) => sum + slot.duration, 0);
    
    if (totalStudyTime > 300) { // More than 5 hours
      tips.push("⏰ Consider reducing daily study time to maintain focus and prevent burnout");
      tips.push("🧘 Take longer breaks (15-30 min) between intensive study sessions");
    } else if (totalStudyTime < 120) { // Less than 2 hours
      tips.push("📈 You have light study time - use it to get ahead on future assignments");
    }
    
    // General productivity tips
    tips.push("📱 Eliminate distractions by putting your phone in another room");
    tips.push("🏃‍♂️ Take a 10-minute walk between study sessions to refresh your mind");
    tips.push("💧 Stay hydrated and have healthy snacks nearby");
    
    return tips;
  }

  /**
   * Create optimal study schedule
   */
  async createOptimalSchedule(tasks, userPreferences, constraints = {}) {
    try {
      const schedule = {
        daily: {},
        weekly: {},
        recommendations: []
      };
      
      // Get available time slots
      const timeSlotsResult = await this.generateTimeSlots(tasks, userPreferences, constraints.unavailableTime);
      
      if (!timeSlotsResult.success) {
        throw new Error('Failed to generate time slots');
      }
      
      const { timeSlots, recommendations } = timeSlotsResult;
      
      // Sort tasks by priority and deadline
      const sortedTasks = this.sortTasksByPriority(tasks);
      
      // Distribute tasks across time slots
      let taskIndex = 0;
      
      timeSlots.forEach(day => {
        schedule.daily[day.date] = {
          day: day.day,
          tasks: [],
          studySessions: []
        };
        
        day.slots.forEach(slot => {
          if (slot.type === 'study' && slot.available && taskIndex < sortedTasks.length) {
            const task = sortedTasks[taskIndex];
            
            schedule.daily[day.date].tasks.push({
              task: task,
              timeSlot: slot,
              estimatedDuration: task.estimated_duration || 60
            });
            
            schedule.daily[day.date].studySessions.push({
              startTime: slot.start_time,
              endTime: slot.end_time,
              duration: slot.duration,
              taskId: task.id,
              taskTitle: task.title
            });
            
            taskIndex++;
          }
        });
      });
      
      // Generate weekly summary
      schedule.weekly = this.generateWeeklySummary(schedule.daily);
      
      // Add recommendations
      schedule.recommendations = recommendations;
      
      return {
        success: true,
        schedule: schedule
      };
    } catch (error) {
      console.error('Error creating optimal schedule:', error);
      return {
        success: false,
        error: 'Failed to create optimal schedule',
        fallback: this.getFallbackSchedule(tasks)
      };
    }
  }

  /**
   * Sort tasks by priority and deadline
   */
  sortTasksByPriority(tasks) {
    return [...tasks].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return moment(a.deadline).diff(moment(b.deadline));
    });
  }

  /**
   * Generate weekly summary
   */
  generateWeeklySummary(dailySchedule) {
    const summary = {
      totalTasks: 0,
      totalStudyTime: 0,
      tasksByPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
      tasksByType: {},
      efficiency: 0
    };
    
    Object.values(dailySchedule).forEach(day => {
      summary.totalTasks += day.tasks.length;
      
      day.tasks.forEach(task => {
        summary.totalStudyTime += task.estimatedDuration || 60;
        summary.tasksByPriority[task.task.priority]++;
        
        const taskType = task.task.task_type || 'other';
        summary.tasksByType[taskType] = (summary.tasksByType[taskType] || 0) + 1;
      });
    });
    
    // Calculate efficiency
    summary.efficiency = Math.round((summary.totalTasks / Math.max(summary.totalStudyTime / 60, 1)) * 100);
    
    return summary;
  }

  /**
   * Get fallback time slots when AI scheduling fails
   */
  getFallbackTimeSlots() {
    return {
      success: false,
      timeSlots: [
        {
          date: moment().format('YYYY-MM-DD'),
          day: 'today',
          slots: [
            { start_time: '09:00', end_time: '10:00', duration: 60, type: 'study', available: true },
            { start_time: '10:15', end_time: '11:15', duration: 60, type: 'study', available: true },
            { start_time: '14:00', end_time: '15:00', duration: 60, type: 'study', available: true },
            { start_time: '15:15', end_time: '16:15', duration: 60, type: 'study', available: true }
          ]
        }
      ],
      recommendations: {
        highPriorityTasks: [],
        optimalStudyTimes: ['09:00-10:00', '14:00-15:00'],
        workloadDistribution: { today: { availableSlots: 4, totalStudyTime: 240, efficiency: 80 } },
        studyTips: ['Use morning hours for difficult subjects', 'Take regular breaks to maintain focus']
      }
    };
  }

  /**
   * Get fallback schedule
   */
  getFallbackSchedule(tasks) {
    const sortedTasks = this.sortTasksByPriority(tasks);
    
    return {
      success: false,
      schedule: {
        daily: {
          [moment().format('YYYY-MM-DD')]: {
            day: 'today',
            tasks: sortedTasks.slice(0, 4).map(task => ({
              task: task,
              timeSlot: { start_time: '09:00', end_time: '10:00', duration: 60 },
              estimatedDuration: task.estimated_duration || 60
            })),
            studySessions: []
          }
        },
        weekly: {
          totalTasks: Math.min(4, sortedTasks.length),
          totalStudyTime: 240,
          efficiency: 75
        },
        recommendations: {
          highPriorityTasks: [],
          optimalStudyTimes: ['09:00-10:00'],
          workloadDistribution: {},
          studyTips: ['Manual scheduling used - consider using AI features for better optimization']
        }
      }
    };
  }
}

module.exports = new SmartScheduler();

