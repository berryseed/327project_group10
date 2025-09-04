require('dotenv').config();
const axios = require("axios");
const moment = require("moment");

// ===== AI Service Configuration =====
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// API Keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class AIService {
  // ===== Analyze a single task =====
  async analyzeTask(taskData) {
    const prompt = `
Analyze this task and return ONLY a valid JSON object with no additional text:
Title: ${taskData.title}
Description: ${taskData.description}
Priority: ${taskData.priority}
Deadline: ${taskData.deadline}

Return this exact JSON format:
{
  "suggestedPriority": "low/medium/high",
  "priorityReasoning": "explanation",
  "deadlineAdjustment": "recommendation",
  "estimatedTime": "X-Y hours",
  "subtasks": ["task1", "task2", "task3"],
  "risks": ["risk1", "risk2", "risk3"]
}
    `;
    return this._callAI(prompt, () => this.getFallbackAnalysis(taskData));
  }

  // ===== Task scheduling =====
  async getScheduleRecommendations(tasks, userPreferences = {}) {
    const taskList = tasks.map(t => `- ${t.title} (${t.priority}, due: ${t.deadline})`).join("\n");
    const prompt = `
Given these tasks:
${taskList}

User preferences: ${JSON.stringify(userPreferences)}

Return ONLY a valid JSON object with this exact format:
{
  "recommendedOrder": ["task1", "task2", "task3"],
  "dailySchedule": {
    "Monday": [{"task": "name", "priority": "high", "estimatedTime": "X hours"}],
    "Tuesday": [{"task": "name", "priority": "medium", "estimatedTime": "Y hours"}]
  },
  "estimatedCompletion": "X hours (approximately Y work days)",
  "workloadBalance": "assessment text",
  "riskFactors": ["risk1", "risk2"]
}
    `;
    return this._callAI(prompt, () => this.getFallbackSchedule(tasks));
  }

  // ===== Generate task suggestions =====
  async generateTaskSuggestions(existingTasks, userInput) {
    const taskHistory = existingTasks.map(t => `${t.title}: ${t.description}`).join("\n");
    const prompt = `
Based on the following task history:
${taskHistory}

And user input: "${userInput}"

Return ONLY a valid JSON object with this exact format:
{
  "suggestions": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "high/medium/low",
      "reasoning": "Why this task is important"
    }
  ],
  "reasoning": "Overall explanation for these suggestions"
}
    `;
    return this._callAI(prompt, () => this.getFallbackSuggestions(userInput));
  }

  // ===== Analyze workload =====
  async analyzeWorkload(tasks, userProductivity = {}) {
    const prompt = `
Analyze this workload:
Tasks: ${JSON.stringify(tasks)}
User Productivity: ${JSON.stringify(userProductivity)}

Return as JSON with:
- workloadAssessment
- completionPrediction
- bottlenecks
- recommendations
- riskLevel
    `;
    return this._callAI(prompt, () => this.getFallbackWorkloadAnalysis(tasks));
  }

  // ===== Full schedule planner =====
  async planFullSchedule(userDescription, userPreferences = {}, constraints = {}) {
    const prompt = `
User description: "${userDescription}"
Preferences: ${JSON.stringify(userPreferences)}
Constraints: ${JSON.stringify(constraints)}

Generate a detailed schedule as JSON array of tasks with:
- title
- description
- estimated_duration (minutes)
- priority (urgent, high, medium, low)
- suggested deadline (ISO format)
    `;
    return this._callAI(prompt, () => this.getFallbackFullSchedule(userDescription, userPreferences, constraints));
  }

  // ===== Private method: call AI with fallback =====
  async _callAI(prompt, fallbackFn) {
    try {
      // Try OpenAI first
      if (OPENAI_API_KEY) {
        try {
          const response = await this.callOpenAI(prompt);
          return this.safeParseJSON(response, fallbackFn);
        } catch (openaiErr) {
          console.log("OpenAI failed, trying Gemini...", openaiErr.message);
        }
      }

      // Try Google Gemini
      if (GEMINI_API_KEY) {
        try {
          const response = await this.callGemini(prompt);
          return this.safeParseJSON(response, fallbackFn);
        } catch (geminiErr) {
          console.log("Gemini failed, trying Anthropic...", geminiErr.message);
        }
      }

      // Try Anthropic Claude
      if (ANTHROPIC_API_KEY) {
        try {
          const response = await this.callAnthropic(prompt);
          return this.safeParseJSON(response, fallbackFn);
        } catch (anthropicErr) {
          console.log("Anthropic failed, using fallback...", anthropicErr.message);
        }
      }

      // All AI services failed, use fallback
      console.log("All AI services failed, using fallback response");
      return { success: false, fallback: fallbackFn() };

    } catch (err) {
      console.error("AI service error:", err);
      return { success: false, fallback: fallbackFn() };
    }
  }

  // ===== OpenAI API Call =====
  async callOpenAI(prompt) {
    const response = await axios.post(OPENAI_API_URL, {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  }

  // ===== Google Gemini API Call =====
  async callGemini(prompt) {
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data.candidates[0].content.parts[0].text;
  }

  // ===== Anthropic Claude API Call =====
  async callAnthropic(prompt) {
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: "claude-3-sonnet-20240229",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
    return response.data.content[0].text;
  }

  // ===== JSON parsing helper =====
  safeParseJSON(text, fallbackFn) {
    try {
      // Try to extract JSON from the response if it's wrapped in text
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Look for JSON objects in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonText);
      return { success: true, data: parsed };
    } catch (error) {
      console.warn("Failed to parse JSON, using fallback. AI response was:", text.substring(0, 200) + "...");
      console.warn("Parse error:", error.message);
      return { success: false, fallback: fallbackFn() };
    }
  }

  // ===== Fallback methods =====
  getFallbackAnalysis(taskData) {
    const priority = this.determinePriority(taskData.title, taskData.description, taskData.priority);
    const estimatedTime = this.estimateTime(taskData.title, taskData.description);
    
    return {
      suggestedPriority: priority,
      priorityReasoning: `Based on task content analysis: ${this.getPriorityReasoning(taskData.title, taskData.description)}`,
      deadlineAdjustment: this.suggestDeadlineAdjustment(taskData.deadline, estimatedTime),
      estimatedTime: estimatedTime,
      subtasks: this.generateSubtasks(taskData.title, taskData.description),
      risks: this.identifyRisks(taskData.title, taskData.description, taskData.deadline)
    };
  }

  getFallbackSchedule(tasks) {
    const sortedTasks = this.sortTasksByPriority(tasks);
    const dailySchedule = this.createDailySchedule(sortedTasks);
    
    return {
      recommendedOrder: sortedTasks.map(t => t.title),
      dailySchedule: dailySchedule,
      estimatedCompletion: this.calculateCompletionTime(tasks),
      workloadBalance: this.assessWorkloadBalance(tasks),
      riskFactors: this.identifyScheduleRisks(tasks)
    };
  }

  getFallbackSuggestions(userInput) {
    const suggestions = this.generateSmartSuggestions(userInput);
    return { 
      suggestions: suggestions,
      reasoning: "Generated based on common project patterns and best practices"
    };
  }

  getFallbackWorkloadAnalysis(tasks) {
    const totalTasks = tasks.length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    const workloadLevel = this.calculateWorkloadLevel(totalTasks, highPriorityTasks);
    
    return {
      workloadAssessment: workloadLevel,
      completionPrediction: this.predictCompletion(tasks),
      bottlenecks: this.identifyBottlenecks(tasks),
      recommendations: this.generateWorkloadRecommendations(tasks, workloadLevel),
      riskLevel: this.assessRiskLevel(tasks)
    };
  }

  getFallbackFullSchedule(userDescription, userPreferences, constraints) {
    const tasks = this.generateTasksFromDescription(userDescription, userPreferences, constraints);
    return {
      tasks: tasks,
      totalDuration: this.calculateTotalDuration(tasks),
      schedule: this.createFullSchedule(tasks, userPreferences, constraints),
      recommendations: this.generateScheduleRecommendations(userDescription, userPreferences)
    };
  }

  // ===== Helper methods for fallback responses =====
  determinePriority(title, description, currentPriority) {
    const urgentKeywords = ['urgent', 'asap', 'deadline', 'critical', 'immediate'];
    const highKeywords = ['important', 'priority', 'due soon', 'deadline'];
    const lowKeywords = ['optional', 'nice to have', 'future', 'someday'];
    
    const text = (title + ' ' + description).toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) return 'urgent';
    if (highKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (lowKeywords.some(keyword => text.includes(keyword))) return 'low';
    return currentPriority || 'medium';
  }

  estimateTime(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('research') || text.includes('analysis')) return '2-4 hours';
    if (text.includes('write') || text.includes('document')) return '3-6 hours';
    if (text.includes('develop') || text.includes('code')) return '4-8 hours';
    if (text.includes('design') || text.includes('create')) return '2-5 hours';
    if (text.includes('test') || text.includes('debug')) return '1-3 hours';
    if (text.includes('meeting') || text.includes('presentation')) return '1-2 hours';
    
    return '2-4 hours';
  }

  getPriorityReasoning(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('deadline') || text.includes('due')) {
      return 'Contains deadline information suggesting urgency';
    }
    if (text.includes('critical') || text.includes('important')) {
      return 'Contains priority indicators';
    }
    if (text.includes('optional') || text.includes('nice to have')) {
      return 'Contains low-priority indicators';
    }
    return 'Standard task priority based on content analysis';
  }

  suggestDeadlineAdjustment(deadline, estimatedTime) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 1) return 'Deadline is very soon, consider extending if possible';
    if (daysUntilDeadline < 3) return 'Deadline is tight, prioritize this task';
    if (daysUntilDeadline > 14) return 'Deadline seems reasonable, current timeline is good';
    return 'Deadline appears appropriate for the task scope';
  }

  generateSubtasks(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const subtasks = [];
    
    if (text.includes('write') || text.includes('document')) {
      subtasks.push('Research and gather information', 'Create outline', 'Write first draft', 'Review and edit', 'Final proofread');
    } else if (text.includes('develop') || text.includes('code')) {
      subtasks.push('Plan architecture', 'Set up development environment', 'Implement core features', 'Add error handling', 'Test and debug');
    } else if (text.includes('design')) {
      subtasks.push('Research design requirements', 'Create wireframes', 'Design mockups', 'Get feedback', 'Refine design');
    } else {
      subtasks.push('Research and plan', 'Execute main task', 'Review results', 'Make improvements', 'Finalize deliverables');
    }
    
    return subtasks;
  }

  identifyRisks(title, description, deadline) {
    const risks = [];
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('complex') || text.includes('difficult')) {
      risks.push('Task complexity may require additional time');
    }
    if (text.includes('depend') || text.includes('wait')) {
      risks.push('Dependencies on other tasks or people');
    }
    if (text.includes('new') || text.includes('learn')) {
      risks.push('Learning curve may extend timeline');
    }
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 3) {
      risks.push('Tight deadline increases risk of incomplete work');
    }
    
    risks.push('Unexpected technical challenges', 'Resource availability', 'Scope creep');
    return risks;
  }

  generateTasksFromDescription(description, preferences, constraints) {
    const tasks = [];
    const desc = description.toLowerCase();
    
    if (desc.includes('student') || desc.includes('course') || desc.includes('project')) {
      tasks.push(
        { title: 'Research and Requirements Gathering', description: 'Understand project requirements and constraints', estimated_duration: 120, priority: 'high', suggested_deadline: this.getDateInDays(2) },
        { title: 'Project Planning and Design', description: 'Create project plan, architecture, and design documents', estimated_duration: 180, priority: 'high', suggested_deadline: this.getDateInDays(5) },
        { title: 'Core Development', description: 'Implement main functionality and features', estimated_duration: 480, priority: 'high', suggested_deadline: this.getDateInDays(12) },
        { title: 'Testing and Debugging', description: 'Test functionality and fix any issues', estimated_duration: 120, priority: 'medium', suggested_deadline: this.getDateInDays(16) },
        { title: 'Documentation and Presentation', description: 'Create documentation and prepare presentation materials', estimated_duration: 90, priority: 'medium', suggested_deadline: this.getDateInDays(18) }
      );
    } else {
      tasks.push(
        { title: 'Initial Planning', description: 'Plan and organize the project', estimated_duration: 60, priority: 'high', suggested_deadline: this.getDateInDays(1) },
        { title: 'Implementation', description: 'Execute the main work', estimated_duration: 240, priority: 'high', suggested_deadline: this.getDateInDays(7) },
        { title: 'Review and Refinement', description: 'Review work and make improvements', estimated_duration: 60, priority: 'medium', suggested_deadline: this.getDateInDays(10) }
      );
    }
    
    return tasks;
  }

  calculateTotalDuration(tasks) {
    return tasks.reduce((sum, task) => sum + task.estimated_duration, 0);
  }

  createFullSchedule(tasks, preferences, constraints) {
    const schedule = {};
    const workDays = preferences.preferredDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const maxHoursPerDay = constraints.maxHoursPerDay || 8;
    
    let currentDay = 0;
    let currentDayHours = 0;
    
    tasks.forEach(task => {
      const taskHours = task.estimated_duration / 60;
      
      if (currentDayHours + taskHours > maxHoursPerDay) {
        currentDay = (currentDay + 1) % workDays.length;
        currentDayHours = 0;
      }
      
      const day = workDays[currentDay];
      if (!schedule[day]) schedule[day] = [];
      
      schedule[day].push({
        task: task.title,
        duration: task.estimated_duration,
        priority: task.priority
      });
      
      currentDayHours += taskHours;
    });
    
    return schedule;
  }

  generateScheduleRecommendations(description, preferences) {
    const recommendations = [];
    
    if (preferences.studyTime === 'evenings') {
      recommendations.push('Schedule complex tasks during your peak evening hours');
    }
    
    if (preferences.preferredDays && preferences.preferredDays.length < 5) {
      recommendations.push('Consider spreading work across more days to avoid burnout');
    }
    
    recommendations.push('Take regular breaks every 90 minutes', 'Review progress weekly and adjust as needed');
    return recommendations;
  }

  getDateInDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  sortTasksByPriority(tasks) {
    const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return tasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      return aPriority - bPriority;
    });
  }

  createDailySchedule(tasks) {
    const schedule = {};
    const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    tasks.forEach((task, index) => {
      const day = workDays[index % workDays.length];
      if (!schedule[day]) schedule[day] = [];
      schedule[day].push({
        task: task.title,
        priority: task.priority,
        estimatedTime: this.estimateTime(task.title, task.description || '')
      });
    });
    
    return schedule;
  }

  calculateCompletionTime(tasks) {
    const totalHours = tasks.reduce((sum, task) => {
      const time = this.estimateTime(task.title, task.description || '');
      const hours = parseInt(time.split('-')[0]);
      return sum + hours;
    }, 0);
    
    const workDays = Math.ceil(totalHours / 8);
    return `${totalHours} hours (approximately ${workDays} work days)`;
  }

  assessWorkloadBalance(tasks) {
    const highPriorityCount = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const totalTasks = tasks.length;
    const highPriorityRatio = highPriorityCount / totalTasks;
    
    if (highPriorityRatio > 0.6) return 'High workload - many urgent tasks';
    if (highPriorityRatio > 0.4) return 'Moderate workload - balanced priorities';
    return 'Manageable workload - good balance';
  }

  identifyScheduleRisks(tasks) {
    const risks = [];
    const highPriorityCount = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    
    if (highPriorityCount > 3) {
      risks.push('Too many high-priority tasks may cause burnout');
    }
    
    const deadlines = tasks.map(t => new Date(t.deadline)).filter(d => !isNaN(d));
    if (deadlines.length > 0) {
      const earliestDeadline = new Date(Math.min(...deadlines));
      const now = new Date();
      const daysUntilEarliest = Math.ceil((earliestDeadline - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEarliest < 2) {
        risks.push('Very tight deadline approaching');
      }
    }
    
    risks.push('Potential for task dependencies', 'Risk of scope changes');
    return risks;
  }

  generateSmartSuggestions(userInput) {
    const input = userInput.toLowerCase();
    const suggestions = [];
    
    if (input.includes('web') || input.includes('website')) {
      suggestions.push(
        'Set up development environment and version control',
        'Create wireframes and user interface mockups',
        'Implement responsive design for mobile devices',
        'Set up testing framework and write unit tests',
        'Deploy to staging environment for testing'
      );
    } else if (input.includes('mobile') || input.includes('app')) {
      suggestions.push(
        'Research platform requirements and guidelines',
        'Create user flow diagrams and wireframes',
        'Set up development environment and tools',
        'Implement core functionality and user interface',
        'Test on multiple devices and screen sizes'
      );
    } else if (input.includes('database') || input.includes('data')) {
      suggestions.push(
        'Design database schema and relationships',
        'Set up database server and configure security',
        'Create data models and migration scripts',
        'Implement data validation and error handling',
        'Set up backup and recovery procedures'
      );
    } else {
      suggestions.push(
        'Break down the project into smaller, manageable tasks',
        'Research best practices and gather resources',
        'Create a detailed project timeline and milestones',
        'Set up project management and collaboration tools',
        'Plan for testing, review, and iteration phases'
      );
    }
    
    return suggestions;
  }

  calculateWorkloadLevel(totalTasks, highPriorityTasks) {
    if (totalTasks > 10 || highPriorityTasks > 5) return 'Very High - Consider reducing scope';
    if (totalTasks > 7 || highPriorityTasks > 3) return 'High - Monitor closely';
    if (totalTasks > 4 || highPriorityTasks > 2) return 'Moderate - Manageable with good planning';
    return 'Low - Comfortable workload';
  }

  predictCompletion(tasks) {
    const totalHours = tasks.reduce((sum, task) => {
      const time = this.estimateTime(task.title, task.description || '');
      const hours = parseInt(time.split('-')[0]);
      return sum + hours;
    }, 0);
    
    const workDays = Math.ceil(totalHours / 8);
    const calendarDays = Math.ceil(workDays / 5) * 7; // Assuming 5 work days per week
    
    return `Estimated ${workDays} work days (${calendarDays} calendar days)`;
  }

  identifyBottlenecks(tasks) {
    const bottlenecks = [];
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    
    if (highPriorityTasks.length > 3) {
      bottlenecks.push('Too many high-priority tasks competing for attention');
    }
    
    const longTasks = tasks.filter(task => {
      const time = this.estimateTime(task.title, task.description || '');
      const hours = parseInt(time.split('-')[1] || time.split('-')[0]);
      return hours > 6;
    });
    
    if (longTasks.length > 0) {
      bottlenecks.push('Long-duration tasks may block other work');
    }
    
    bottlenecks.push('Potential dependency chains', 'Resource allocation conflicts');
    return bottlenecks;
  }

  generateWorkloadRecommendations(tasks, workloadLevel) {
    const recommendations = [];
    
    if (workloadLevel.includes('Very High') || workloadLevel.includes('High')) {
      recommendations.push('Consider delegating some tasks', 'Break large tasks into smaller chunks');
      recommendations.push('Prioritize tasks by impact and urgency', 'Schedule regular breaks to maintain productivity');
    } else {
      recommendations.push('Maintain current pace and quality', 'Look for opportunities to take on additional value-added tasks');
    }
    
    recommendations.push('Use time-blocking techniques', 'Regularly review and adjust priorities');
    return recommendations;
  }

  assessRiskLevel(tasks) {
    const highPriorityCount = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const totalTasks = tasks.length;
    
    if (highPriorityCount > totalTasks * 0.6) return 'High Risk';
    if (highPriorityCount > totalTasks * 0.4) return 'Medium Risk';
    return 'Low Risk';
  }
}

module.exports = new AIService();
