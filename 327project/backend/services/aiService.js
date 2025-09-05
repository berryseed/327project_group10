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
    const taskDetails = tasks.map(t => ({
      title: t.title,
      priority: t.priority,
      deadline: t.deadline,
      estimated_duration: t.estimated_duration,
      task_type: t.task_type,
      course_code: t.course_code,
      status: t.status
    }));

    const prompt = `
As a time management expert for students, create an optimal study schedule:

STUDENT TASKS:
${JSON.stringify(taskDetails, null, 2)}

USER PREFERENCES:
${JSON.stringify(userPreferences, null, 2)}

Create a comprehensive scheduling plan in this EXACT JSON format:
{
  "recommendedOrder": ["Task 1", "Task 2", "Task 3"],
  "dailySchedule": {
    "Monday": [{"task": "Task name", "priority": "high", "estimatedTime": "X hours", "timeSlot": "9:00-11:00", "studyStrategy": "specific approach"}],
    "Tuesday": [{"task": "Task name", "priority": "medium", "estimatedTime": "Y hours", "timeSlot": "14:00-16:00", "studyStrategy": "specific approach"}]
  },
  "estimatedCompletion": "X hours (approximately Y work days)",
  "workloadBalance": "Detailed assessment of schedule balance and sustainability",
  "riskFactors": ["Specific risk 1", "Specific risk 2"],
  "studyTips": ["Personalized study tip 1", "Personalized study tip 2"],
  "breakRecommendations": ["When and how to take breaks"],
  "deadlineStrategy": "Specific approach to meeting deadlines",
  "productivityOptimization": "Ways to maximize study efficiency"
}

Focus on:
- Academic deadlines and priorities
- Realistic time blocks and study sessions
- Energy management and peak performance times
- Task dependencies and logical sequencing
- Burnout prevention and sustainable study habits
    `;
    return this._callAI(prompt, () => this.getFallbackSchedule(tasks, userPreferences));
  }

  // ===== Generate task suggestions =====
  async generateTaskSuggestions(existingTasks, userInput) {
    const taskHistory = existingTasks.map(t => ({
      title: t.title,
      description: t.description,
      task_type: t.task_type,
      course_code: t.course_code,
      priority: t.priority,
      deadline: t.deadline
    }));

    const prompt = `
As an academic advisor, analyze this student's current tasks and provide intelligent task suggestions:

CURRENT TASK PORTFOLIO:
${JSON.stringify(taskHistory, null, 2)}

STUDENT REQUEST: "${userInput}"

Provide smart task suggestions in this EXACT JSON format:
{
  "suggestions": [
    {
      "title": "Specific, actionable task title",
      "description": "Detailed description with clear deliverables",
      "priority": "high/medium/low",
      "reasoning": "Academic justification and strategic importance",
      "estimatedDuration": "X-Y hours",
      "suggestedDeadline": "YYYY-MM-DD",
      "taskType": "assignment/exam/project/study/class",
      "courseCode": "relevant course if applicable",
      "dependencies": ["any prerequisite tasks"],
      "studyTips": ["specific study strategy for this task"]
    }
  ],
  "reasoning": "Overall academic strategy explanation",
  "gapAnalysis": "What's missing from current workload",
  "academicAdvice": "Broader academic success recommendations"
}

Focus on:
- Academic best practices and common student needs
- Task dependencies and logical sequencing
- Realistic time estimates for academic work
- Course-specific requirements and patterns
- Study efficiency and learning optimization
    `;
    return this._callAI(prompt, () => this.getFallbackSuggestions(userInput, existingTasks));
  }

  // ===== Analyze workload =====
  async analyzeWorkload(tasks, userProductivity = {}) {
    const taskSummary = tasks.map(t => ({
      title: t.title,
      priority: t.priority,
      deadline: t.deadline,
      status: t.status,
      estimated_duration: t.estimated_duration,
      task_type: t.task_type,
      course_code: t.course_code
    }));

    const prompt = `
As an academic productivity expert, analyze this student's workload and provide actionable insights:

STUDENT TASKS:
${JSON.stringify(taskSummary, null, 2)}

USER PRODUCTIVITY PROFILE:
${JSON.stringify(userProductivity, null, 2)}

Provide a comprehensive workload analysis in this EXACT JSON format:
{
  "workloadAssessment": "Detailed assessment of current workload level (Low/Moderate/High/Overwhelming) with specific reasoning",
  "completionPrediction": "Realistic timeline prediction based on task complexity and deadlines",
  "bottlenecks": ["Specific bottleneck 1", "Specific bottleneck 2", "Specific bottleneck 3"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "riskLevel": "Low/Medium/High risk assessment with explanation",
  "priorityActions": ["Immediate action 1", "Immediate action 2"],
  "studyStrategy": "Personalized study strategy recommendation",
  "timeManagement": "Specific time management advice"
}

Focus on:
- Academic context and deadlines
- Task dependencies and sequencing
- Realistic time estimates
- Burnout prevention
- Academic success optimization
    `;
    return this._callAI(prompt, () => this.getFallbackWorkloadAnalysis(tasks, userProductivity));
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
      // Try Google Gemini first (since it's working)
      if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        try {
          console.log("🤖 Trying Gemini API...");
          const response = await this.callGemini(prompt);
          const result = this.safeParseJSON(response, fallbackFn);
          if (result.success) {
            console.log("✅ Gemini API: Success");
            return result;
          } else {
            console.log("⚠️ Gemini API: JSON parsing failed, trying next API...");
          }
        } catch (geminiErr) {
          console.log("❌ Gemini failed:", geminiErr.message);
        }
      }

      // Try OpenAI
      if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
        try {
          console.log("🤖 Trying OpenAI API...");
          const response = await this.callOpenAI(prompt);
          const result = this.safeParseJSON(response, fallbackFn);
          if (result.success) {
            console.log("✅ OpenAI API: Success");
            return result;
          } else {
            console.log("⚠️ OpenAI API: JSON parsing failed, trying next API...");
          }
        } catch (openaiErr) {
          console.log("❌ OpenAI failed:", openaiErr.message);
        }
      }

      // Try Anthropic Claude
      if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
        try {
          console.log("🤖 Trying Anthropic API...");
          const response = await this.callAnthropic(prompt);
          const result = this.safeParseJSON(response, fallbackFn);
          if (result.success) {
            console.log("✅ Anthropic API: Success");
            return result;
          } else {
            console.log("⚠️ Anthropic API: JSON parsing failed, using fallback...");
          }
        } catch (anthropicErr) {
          console.log("❌ Anthropic failed:", anthropicErr.message);
        }
      }

      // All AI services failed, use fallback
      console.log("🔄 All AI services failed, using intelligent fallback response");
      return { success: false, fallback: fallbackFn() };

    } catch (err) {
      console.error("AI service error:", err);
      return { success: false, fallback: fallbackFn() };
    }
  }

  // ===== OpenAI API Call =====
  async callOpenAI(prompt) {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await axios.post(OPENAI_API_URL, {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    return response.data.choices[0].message.content;
  }

  // ===== Google Gemini API Call =====
  async callGemini(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }
    
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    return response.data.candidates[0].content.parts[0].text;
  }

  // ===== Anthropic Claude API Call =====
  async callAnthropic(prompt) {
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      throw new Error('Anthropic API key not configured');
    }
    
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
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
      
      // Look for JSON objects in the text - try multiple patterns
      let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON array
        jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      }
      if (!jsonMatch) {
        // Try to find any JSON-like structure
        jsonMatch = jsonText.match(/(\{|\[)[\s\S]*(\}|\])/);
      }
      
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      // Try to parse as-is first
      try {
      const parsed = JSON.parse(jsonText);
      return { success: true, data: parsed };
      } catch (firstError) {
        // If that fails, try to fix common issues
        jsonText = this.fixCommonJSONIssues(jsonText);
        
        try {
          const parsed = JSON.parse(jsonText);
          return { success: true, data: parsed };
        } catch (secondError) {
          // If that still fails, try a more aggressive approach
          jsonText = this.aggressiveJSONFix(jsonText);
          
          try {
            const parsed = JSON.parse(jsonText);
            return { success: true, data: parsed };
          } catch (thirdError) {
            throw thirdError;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to parse JSON, using fallback. AI response was:", text.substring(0, 200) + "...");
      console.warn("Parse error:", error.message);
      return { success: false, fallback: fallbackFn() };
    }
  }

  // ===== Aggressive JSON fixing =====
  aggressiveJSONFix(jsonText) {
    // Remove all control characters except newlines and tabs
    jsonText = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Fix newlines in strings by replacing with spaces
    jsonText = jsonText.replace(/"([^"]*)[\n\r]([^"]*)"/g, '"$1 $2"');
    
    // Fix incomplete strings
    jsonText = jsonText.replace(/"([^"]*)[\n\r]/g, '"$1"');
    
    // Fix trailing commas
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing quotes around property names
    jsonText = jsonText.replace(/([^"]\w+):/g, '"$1":');
    
    // Fix single quotes
    jsonText = jsonText.replace(/'/g, '"');
    
    // Try to close incomplete JSON
    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    
    for (let i = 0; i < openBraces - closeBraces; i++) {
      jsonText += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      jsonText += ']';
    }
    
    return jsonText;
  }

  // ===== Fix common JSON issues =====
  fixCommonJSONIssues(jsonText) {
    // Remove any remaining markdown code blocks
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Fix control characters and newlines in strings - more aggressive approach
    jsonText = jsonText.replace(/"([^"]*)[\n\r\t]([^"]*)"/g, '"$1 $2"');
    jsonText = jsonText.replace(/"([^"]*)[\n\r\t]/g, '"$1"');
    
    // Fix unescaped quotes in strings
    jsonText = jsonText.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"');
    
    // Fix missing quotes around property names (but not if already quoted)
    jsonText = jsonText.replace(/([^"]\w+):/g, '"$1":');
    
    // Fix single quotes to double quotes
    jsonText = jsonText.replace(/'/g, '"');
    
    // Fix trailing commas
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix incomplete arrays or objects at the end
    jsonText = jsonText.replace(/,\s*$/, '');
    
    // Fix incomplete JSON by trying to close it properly
    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    
    // Add missing closing braces/brackets
    for (let i = 0; i < openBraces - closeBraces; i++) {
      jsonText += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      jsonText += ']';
    }
    
    // Fix incomplete strings at the end
    jsonText = jsonText.replace(/"([^"]*)$/, '"$1"');
    
    // Remove any remaining control characters
    jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, ' ');
    
    return jsonText;
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

  getFallbackSchedule(tasks, userPreferences = {}) {
    const sortedTasks = this.sortTasksByPriority(tasks);
    const dailySchedule = this.createDailySchedule(sortedTasks);
    
    return {
      recommendedOrder: sortedTasks.map(t => t.title),
      dailySchedule: dailySchedule,
      estimatedCompletion: this.calculateCompletionTime(tasks),
      workloadBalance: this.assessWorkloadBalance(tasks),
      riskFactors: this.identifyScheduleRisks(tasks),
      studyTips: this.generateStudyTips(tasks, userPreferences),
      breakRecommendations: this.getBreakRecommendations(tasks),
      deadlineStrategy: this.getDeadlineStrategy(tasks),
      productivityOptimization: this.getProductivityTips(tasks, userPreferences)
    };
  }

  getFallbackSuggestions(userInput, existingTasks = []) {
    const suggestions = this.generateSmartSuggestions(userInput, existingTasks);
    return { 
      suggestions: suggestions,
      reasoning: "Generated based on academic best practices and common student needs",
      gapAnalysis: this.analyzeGaps(existingTasks, userInput),
      academicAdvice: this.getAcademicAdvice(existingTasks, userInput)
    };
  }

  getFallbackWorkloadAnalysis(tasks, userProductivity = {}) {
    const totalTasks = tasks.length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending' || !t.status).length;
    const upcomingDeadlines = this.getUpcomingDeadlines(tasks);
    
    const workloadLevel = this.calculateWorkloadLevel(totalTasks, highPriorityTasks);
    
    return {
      workloadAssessment: `${workloadLevel} - ${totalTasks} total tasks, ${highPriorityTasks} high priority, ${pendingTasks} pending`,
      completionPrediction: this.predictCompletion(tasks),
      bottlenecks: this.identifyBottlenecks(tasks),
      recommendations: this.generateWorkloadRecommendations(tasks, workloadLevel),
      riskLevel: this.assessRiskLevel(tasks),
      priorityActions: this.getPriorityActions(tasks, upcomingDeadlines),
      studyStrategy: this.getStudyStrategy(tasks, userProductivity),
      timeManagement: this.getTimeManagementAdvice(tasks, userProductivity)
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

  generateSmartSuggestions(userInput, existingTasks = []) {
    const input = userInput.toLowerCase();
    const suggestions = [];
    
    // Analyze existing tasks to provide contextual suggestions
    const taskTypes = existingTasks.map(t => t.task_type).filter(Boolean);
    const courses = [...new Set(existingTasks.map(t => t.course_code).filter(Boolean))];
    const priorities = existingTasks.map(t => t.priority).filter(Boolean);
    const hasUrgentTasks = priorities.includes('urgent') || priorities.includes('high');
    
    // Extract subject/course context from user input
    const subjectContext = this.extractSubjectContext(input, existingTasks);
    
    // Physics-specific suggestions
    if (input.includes('physics') || subjectContext.includes('physics')) {
      suggestions.push(
        { title: 'Review physics formulas and equations', description: 'Create a comprehensive formula sheet for mechanics, thermodynamics, and other topics', priority: 'high', reasoning: 'Essential for physics exam success', estimatedDuration: '2-3 hours', taskType: 'study', studyTips: ['Practice deriving formulas from basic principles', 'Create visual diagrams for complex concepts'] },
        { title: 'Solve practice problems by topic', description: 'Work through problems systematically by physics topic (mechanics, thermodynamics, etc.)', priority: 'high', reasoning: 'Builds problem-solving skills and identifies weak areas', estimatedDuration: '3-4 hours', taskType: 'study', studyTips: ['Start with easier problems and gradually increase difficulty', 'Time yourself to simulate exam conditions'] },
        { title: 'Review physics lab reports and experiments', description: 'Go through lab notes and understand experimental procedures and results', priority: 'medium', reasoning: 'Lab concepts often appear in physics exams', estimatedDuration: '1-2 hours', taskType: 'study', studyTips: ['Focus on understanding the physics principles behind each experiment'] }
      );
    }
    // Math-specific suggestions
    else if (input.includes('math') || input.includes('calculus') || input.includes('algebra') || subjectContext.includes('math')) {
      suggestions.push(
        { title: 'Practice calculus problems by type', description: 'Work through derivatives, integrals, and applications systematically', priority: 'high', reasoning: 'Calculus requires extensive practice to master', estimatedDuration: '3-4 hours', taskType: 'study', studyTips: ['Focus on understanding the concepts, not just memorizing procedures', 'Practice with a variety of problem types'] },
        { title: 'Create math concept summary sheets', description: 'Organize key formulas, theorems, and problem-solving strategies', priority: 'high', reasoning: 'Helps with quick reference during exams', estimatedDuration: '1-2 hours', taskType: 'study', studyTips: ['Use color coding for different types of problems', 'Include example problems for each concept'] },
        { title: 'Review homework solutions and corrections', description: 'Go through previous assignments to identify common mistakes', priority: 'medium', reasoning: 'Learning from mistakes prevents repetition', estimatedDuration: '1-2 hours', taskType: 'study', studyTips: ['Focus on understanding why mistakes were made', 'Practice similar problems to reinforce correct methods'] }
      );
    }
    // Computer Science/Programming suggestions
    else if (input.includes('programming') || input.includes('coding') || input.includes('computer science') || input.includes('cs') || subjectContext.includes('computer')) {
      suggestions.push(
        { title: 'Review programming concepts and syntax', description: 'Go through key programming concepts, data structures, and algorithms', priority: 'high', reasoning: 'Programming exams test both theory and practical knowledge', estimatedDuration: '2-3 hours', taskType: 'study', studyTips: ['Practice coding by hand without IDE assistance', 'Review common algorithms and their time complexity'] },
        { title: 'Practice coding problems and debugging', description: 'Work through programming exercises and practice debugging techniques', priority: 'high', reasoning: 'Hands-on practice is essential for programming success', estimatedDuration: '3-4 hours', taskType: 'study', studyTips: ['Start with simple problems and build complexity', 'Practice explaining your code logic out loud'] },
        { title: 'Review project code and documentation', description: 'Go through previous programming projects and understand the code structure', priority: 'medium', reasoning: 'Understanding project patterns helps with exam questions', estimatedDuration: '1-2 hours', taskType: 'study', studyTips: ['Focus on understanding design patterns and best practices'] }
      );
    }
    // General exam preparation
    else if (input.includes('exam') || input.includes('test') || input.includes('quiz') || input.includes('final')) {
      suggestions.push(
        { title: 'Create comprehensive study guide', description: 'Organize all course materials into a structured study guide', priority: 'high', reasoning: 'Essential for systematic exam preparation', estimatedDuration: '2-3 hours', taskType: 'study', studyTips: ['Use active recall techniques while creating the guide', 'Include key concepts, formulas, and examples'] },
        { title: 'Practice with past exams and sample questions', description: 'Work through previous tests to identify patterns and question types', priority: 'high', reasoning: 'Builds confidence and identifies weak areas', estimatedDuration: '3-4 hours', taskType: 'study', studyTips: ['Time yourself to simulate exam conditions', 'Review answers thoroughly, not just correct ones'] },
        { title: 'Form study groups or find study partners', description: 'Connect with classmates for collaborative studying and peer teaching', priority: 'medium', reasoning: 'Group study can help clarify difficult concepts', estimatedDuration: '1 hour', taskType: 'study', studyTips: ['Explain concepts to others to test your understanding', 'Use study groups for practice problems and discussions'] }
      );
    }
    // Assignment/Project suggestions
    else if (input.includes('assignment') || input.includes('homework') || input.includes('project') || input.includes('paper')) {
      suggestions.push(
        { title: 'Read assignment requirements thoroughly', description: 'Carefully review all instructions, grading criteria, and deliverables', priority: 'high', reasoning: 'Prevents misunderstandings and ensures completeness', estimatedDuration: '30 minutes', taskType: 'assignment', studyTips: ['Highlight key requirements and deadlines', 'Ask questions if anything is unclear'] },
        { title: 'Create detailed project timeline', description: 'Break down the assignment into manageable tasks with deadlines', priority: 'high', reasoning: 'Helps manage time and track progress', estimatedDuration: '1 hour', taskType: 'assignment', studyTips: ['Include buffer time for unexpected challenges', 'Set mini-deadlines for each section'] },
        { title: 'Research and gather resources', description: 'Find relevant materials, references, and tools needed for the assignment', priority: 'medium', reasoning: 'Provides foundation for quality work', estimatedDuration: '2-3 hours', taskType: 'assignment', studyTips: ['Use academic databases and credible sources', 'Take detailed notes with proper citations'] }
      );
    }
    // Web development suggestions
    else if (input.includes('web') || input.includes('website') || input.includes('frontend') || input.includes('html') || input.includes('css') || input.includes('javascript')) {
      suggestions.push(
        { title: 'Set up development environment and version control', description: 'Install necessary tools, set up Git repository, and configure development environment', priority: 'high', reasoning: 'Foundation for web development project', estimatedDuration: '2-3 hours', taskType: 'project', studyTips: ['Use a code editor like VS Code with helpful extensions', 'Learn basic Git commands for version control'] },
        { title: 'Create wireframes and user interface mockups', description: 'Design the visual layout and user experience before coding', priority: 'high', reasoning: 'Essential planning step before coding', estimatedDuration: '3-4 hours', taskType: 'project', studyTips: ['Use tools like Figma or draw by hand', 'Focus on user experience and accessibility'] },
        { title: 'Implement responsive design for mobile devices', description: 'Ensure website works well on all screen sizes and devices', priority: 'medium', reasoning: 'Modern web development requirement', estimatedDuration: '4-6 hours', taskType: 'project', studyTips: ['Test on multiple devices and browsers', 'Use CSS media queries for responsive design'] }
      );
    }
    // Context-based suggestions based on existing tasks
    else {
      // If user has urgent tasks, focus on time management
      if (hasUrgentTasks) {
        suggestions.push(
          { title: 'Prioritize urgent tasks and create action plan', description: 'Identify the most critical tasks and create a focused action plan', priority: 'high', reasoning: 'Urgent tasks need immediate attention to avoid negative consequences', estimatedDuration: '30 minutes', taskType: 'study', studyTips: ['Use the Eisenhower Matrix to categorize tasks', 'Focus on one urgent task at a time'] }
        );
      }
      
      // If user has exams coming up
      if (taskTypes.includes('exam')) {
        suggestions.push(
          { title: 'Schedule regular study sessions', description: 'Set up consistent study times for better retention and preparation', priority: 'high', reasoning: 'Spaced repetition improves learning and retention', estimatedDuration: '1 hour', taskType: 'study', studyTips: ['Use the Pomodoro technique (25 min study, 5 min break)', 'Study at the same time each day for consistency'] }
        );
      }
      
      // If user has multiple courses
      if (courses.length > 1) {
        suggestions.push(
          { title: 'Create master schedule for all courses', description: 'Organize all course deadlines, exams, and assignments in one place', priority: 'medium', reasoning: 'Prevents conflicts and helps balance workload across courses', estimatedDuration: '1 hour', taskType: 'study', studyTips: ['Use a digital calendar or planner app', 'Color-code by course for easy identification'] }
        );
      }
      
      // General productivity suggestions
      suggestions.push(
        { title: 'Set up optimal study environment', description: 'Create a distraction-free study space with all necessary materials', priority: 'medium', reasoning: 'Good study environment improves concentration and productivity', estimatedDuration: '1 hour', taskType: 'study', studyTips: ['Remove distractions like phones and social media', 'Ensure good lighting and comfortable seating'] },
        { title: 'Review course syllabus and upcoming deadlines', description: 'Stay organized and plan ahead for all courses and assignments', priority: 'medium', reasoning: 'Prevents last-minute stress and missed deadlines', estimatedDuration: '30 minutes', taskType: 'study', studyTips: ['Add all important dates to your calendar', 'Set reminders for upcoming deadlines'] }
      );
    }
    
    return suggestions;
  }

  // Helper method to extract subject context
  extractSubjectContext(input, existingTasks) {
    const subjects = [];
    const inputLower = input.toLowerCase();
    
    // Common subject keywords
    const subjectKeywords = {
      'physics': ['physics', 'mechanics', 'thermodynamics', 'quantum', 'electromagnetism'],
      'math': ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'statistics'],
      'computer': ['computer science', 'programming', 'coding', 'software', 'algorithm'],
      'chemistry': ['chemistry', 'organic', 'inorganic', 'biochemistry'],
      'biology': ['biology', 'anatomy', 'physiology', 'genetics'],
      'english': ['english', 'literature', 'writing', 'composition'],
      'history': ['history', 'historical', 'ancient', 'modern'],
      'psychology': ['psychology', 'psych', 'behavioral', 'cognitive']
    };
    
    // Check input for subject keywords
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        subjects.push(subject);
      }
    }
    
    // Check existing tasks for subject context
    existingTasks.forEach(task => {
      const taskText = (task.title + ' ' + task.description + ' ' + (task.course_code || '')).toLowerCase();
      for (const [subject, keywords] of Object.entries(subjectKeywords)) {
        if (keywords.some(keyword => taskText.includes(keyword))) {
          subjects.push(subject);
        }
      }
    });
    
    return [...new Set(subjects)]; // Remove duplicates
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

  // New helper methods for enhanced fallback responses
  getUpcomingDeadlines(tasks) {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0;
    });
  }

  getPriorityActions(tasks, upcomingDeadlines) {
    const actions = [];
    
    if (upcomingDeadlines.length > 0) {
      actions.push(`Focus on ${upcomingDeadlines[0].title} - due soon`);
    }
    
    const highPriorityPending = tasks.filter(t => 
      (t.priority === 'high' || t.priority === 'urgent') && 
      (t.status === 'pending' || !t.status)
    );
    
    if (highPriorityPending.length > 0) {
      actions.push(`Complete high-priority task: ${highPriorityPending[0].title}`);
    }
    
    return actions;
  }

  getStudyStrategy(tasks, userProductivity) {
    const taskTypes = tasks.map(t => t.task_type).filter(Boolean);
    const hasExams = taskTypes.includes('exam');
    const hasProjects = taskTypes.includes('project');
    
    if (hasExams && hasProjects) {
      return 'Balanced approach: Alternate between intensive exam study sessions and project work to maintain momentum';
    } else if (hasExams) {
      return 'Focused exam preparation: Use spaced repetition and active recall techniques';
    } else if (hasProjects) {
      return 'Project-focused: Break large projects into daily milestones with regular progress reviews';
    }
    
    return 'General study strategy: Use Pomodoro technique with 25-minute focused sessions';
  }

  getTimeManagementAdvice(tasks, userProductivity) {
    const totalTasks = tasks.length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    
    if (totalTasks > 8) {
      return 'Consider time-blocking: Allocate specific time slots for each task type to avoid context switching';
    } else if (highPriorityTasks > 3) {
      return 'Prioritize ruthlessly: Focus on high-impact tasks first and consider delegating or postponing lower-priority items';
    }
    
    return 'Maintain current pace: Your workload is manageable with good time management practices';
  }

  analyzeGaps(existingTasks, userInput) {
    const taskTypes = existingTasks.map(t => t.task_type).filter(Boolean);
    const gaps = [];
    
    if (!taskTypes.includes('study') && userInput.toLowerCase().includes('exam')) {
      gaps.push('Missing dedicated study time for exam preparation');
    }
    
    if (!taskTypes.includes('project') && userInput.toLowerCase().includes('project')) {
      gaps.push('No project planning or milestone tasks identified');
    }
    
    if (existingTasks.length < 3) {
      gaps.push('Consider breaking down large tasks into smaller, manageable pieces');
    }
    
    return gaps.length > 0 ? gaps.join('; ') : 'Current task portfolio appears well-balanced';
  }

  getAcademicAdvice(existingTasks, userInput) {
    const courses = [...new Set(existingTasks.map(t => t.course_code).filter(Boolean))];
    const advice = [];
    
    if (courses.length > 4) {
      advice.push('You have many courses - consider creating a master schedule to balance workload across subjects');
    }
    
    if (userInput.toLowerCase().includes('overwhelmed') || userInput.toLowerCase().includes('stress')) {
      advice.push('Consider using the Pomodoro technique and taking regular breaks to manage stress');
    }
    
    advice.push('Regular review of your task list and priorities will help maintain academic success');
    
    return advice.join('; ');
  }

  generateStudyTips(tasks, userPreferences) {
    const tips = [];
    const taskTypes = tasks.map(t => t.task_type).filter(Boolean);
    
    if (taskTypes.includes('exam')) {
      tips.push('Use active recall techniques for exam preparation');
      tips.push('Create summary sheets for each subject');
    }
    
    if (taskTypes.includes('project')) {
      tips.push('Break large projects into daily milestones');
      tips.push('Set up regular progress check-ins');
    }
    
    tips.push('Use the Pomodoro technique for focused study sessions');
    tips.push('Take breaks every 90 minutes to maintain productivity');
    
    return tips;
  }

  getBreakRecommendations(tasks) {
    const totalHours = tasks.reduce((sum, task) => {
      const duration = task.estimated_duration || 60;
      return sum + (duration / 60);
    }, 0);
    
    if (totalHours > 6) {
      return ['Take a 15-minute break every 2 hours', 'Include a longer 30-minute break for meals'];
    } else if (totalHours > 4) {
      return ['Take a 10-minute break every 90 minutes'];
    }
    
    return ['Take a 5-minute break every hour'];
  }

  getDeadlineStrategy(tasks) {
    const upcomingDeadlines = this.getUpcomingDeadlines(tasks);
    
    if (upcomingDeadlines.length > 2) {
      return 'Multiple deadlines approaching - prioritize by urgency and impact, consider asking for extensions if needed';
    } else if (upcomingDeadlines.length === 1) {
      return 'Single deadline focus - allocate extra time to ensure quality completion';
    }
    
    return 'No immediate deadlines - use this time to get ahead on future assignments';
  }

  getProductivityTips(tasks, userPreferences) {
    const tips = [];
    
    tips.push('Start with your most challenging task when energy is highest');
    tips.push('Use time-blocking to minimize context switching');
    tips.push('Eliminate distractions by using focus apps or study environments');
    
    if (userPreferences.preferredWorkTime === 'morning') {
      tips.push('Schedule complex tasks during your peak morning hours');
    } else if (userPreferences.preferredWorkTime === 'evening') {
      tips.push('Reserve evening hours for your most important work');
    }
    
    return tips;
  }
}

module.exports = new AIService();
