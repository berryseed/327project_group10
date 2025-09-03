const OpenAI = require('openai');
const natural = require('natural');
const moment = require('moment');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Tokenizer for text analysis
const tokenizer = new natural.WordTokenizer();

class AIService {
  
  /**
   * Analyze task and suggest optimal priority and deadline
   */
  async analyzeTask(taskData) {
    try {
      const prompt = `Analyze this task and provide recommendations:
        Task: ${taskData.title}
        Description: ${taskData.description}
        Current Priority: ${taskData.priority}
        Current Deadline: ${taskData.deadline}
        
        Please provide:
        1. Suggested priority (low/medium/high) with reasoning
        2. Recommended deadline adjustment if needed
        3. Estimated completion time
        4. Suggested subtasks breakdown
        5. Any potential risks or dependencies
        
        Format as JSON:
        {
          "suggestedPriority": "high",
          "priorityReasoning": "explanation",
          "deadlineAdjustment": "keep current or suggest new",
          "estimatedTime": "2-3 hours",
          "subtasks": ["subtask1", "subtask2"],
          "risks": ["risk1", "risk2"]
        }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      return {
        success: true,
        analysis,
        originalTask: taskData
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        success: false,
        error: 'AI analysis failed',
        fallback: this.getFallbackAnalysis(taskData)
      };
    }
  }

  /**
   * Get intelligent task scheduling recommendations
   */
  async getScheduleRecommendations(tasks, userPreferences = {}) {
    try {
      const taskList = tasks.map(task => 
        `- ${task.title} (${task.priority} priority, due: ${task.deadline})`
      ).join('\n');

      const prompt = `Given these tasks, suggest the optimal order and schedule:
        ${taskList}
        
        User preferences: ${JSON.stringify(userPreferences)}
        
        Consider:
        - Priority levels
        - Deadlines
        - Task dependencies
        - Estimated completion times
        - Workload distribution
        
        Provide a JSON response with:
        {
          "recommendedOrder": ["task1", "task2"],
          "dailySchedule": {
            "day1": ["task1", "task2"],
            "day2": ["task3"]
          },
          "estimatedCompletion": "date",
          "workloadBalance": "balanced/uneven",
          "riskFactors": ["risk1", "risk2"]
        }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.6
      });

      return {
        success: true,
        recommendations: JSON.parse(completion.choices[0].message.content)
      };
    } catch (error) {
      console.error('Schedule recommendation error:', error);
      return {
        success: false,
        error: 'Schedule recommendation failed',
        fallback: this.getFallbackSchedule(tasks)
      };
    }
  }

  /**
   * Generate intelligent task suggestions based on patterns
   */
  async generateTaskSuggestions(existingTasks, userInput) {
    try {
      const taskHistory = existingTasks.map(task => 
        `${task.title}: ${task.description}`
      ).join('\n');

      const prompt = `Based on this task history and user input, suggest relevant tasks:
        Task History:
        ${taskHistory}
        
        User Input: "${userInput}"
        
        Suggest 3-5 related tasks that would be helpful. Consider:
        - Similar patterns in existing tasks
        - Logical next steps
        - Common project management practices
        
        Return as JSON:
        {
          "suggestions": [
            {
              "title": "Task title",
              "description": "Task description",
              "priority": "low/medium/high",
              "reasoning": "Why this task is suggested"
            }
          ]
        }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.8
      });

      return {
        success: true,
        suggestions: JSON.parse(completion.choices[0].message.content)
      };
    } catch (error) {
      console.error('Task suggestion error:', error);
      return {
        success: false,
        error: 'Task suggestion failed',
        fallback: this.getFallbackSuggestions(userInput)
      };
    }
  }

  /**
   * Analyze workload and predict completion times
   */
  async analyzeWorkload(tasks, userProductivity = {}) {
    try {
      const taskAnalysis = tasks.map(task => ({
        title: task.title,
        priority: task.priority,
        deadline: task.deadline,
        estimatedTime: task.estimatedTime || '2 hours'
      }));

      const prompt = `Analyze this workload and provide insights:
        Tasks: ${JSON.stringify(taskAnalysis)}
        User Productivity: ${JSON.stringify(userProductivity)}
        
        Provide analysis in JSON format:
        {
          "workloadAssessment": "overloaded/balanced/light",
          "completionPrediction": "likely completion date",
          "bottlenecks": ["bottleneck1", "bottleneck2"],
          "recommendations": ["rec1", "rec2"],
          "riskLevel": "low/medium/high"
        }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.5
      });

      return {
        success: true,
        analysis: JSON.parse(completion.choices[0].message.content)
      };
    } catch (error) {
      console.error('Workload analysis error:', error);
      return {
        success: false,
        error: 'Workload analysis failed',
        fallback: this.getFallbackWorkloadAnalysis(tasks)
      };
    }
  }

  // Fallback methods when AI is unavailable
  getFallbackAnalysis(taskData) {
    const priority = taskData.priority === 'medium' ? 'high' : taskData.priority;
    return {
      suggestedPriority: priority,
      priorityReasoning: 'AI analysis unavailable, using fallback logic',
      deadlineAdjustment: 'keep current',
      estimatedTime: '2-4 hours',
      subtasks: ['Research', 'Plan', 'Execute', 'Review'],
      risks: ['Time constraints', 'Resource availability']
    };
  }

  getFallbackSchedule(tasks) {
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority === 'medium' && b.priority === 'low') return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    return {
      recommendedOrder: sortedTasks.map(t => t.title),
      dailySchedule: { 'today': sortedTasks.slice(0, 3).map(t => t.title) },
      estimatedCompletion: moment().add(7, 'days').format('YYYY-MM-DD'),
      workloadBalance: 'balanced',
      riskFactors: ['Manual scheduling used']
    };
  }

  getFallbackSuggestions(userInput) {
    return {
      suggestions: [
        {
          title: `Follow up on: ${userInput}`,
          description: 'Check progress and next steps',
          priority: 'medium',
          reasoning: 'Based on user input pattern'
        },
        {
          title: 'Review and plan',
          description: 'Weekly review and planning session',
          priority: 'high',
          reasoning: 'Regular maintenance task'
        }
      ]
    };
  }

  getFallbackWorkloadAnalysis(tasks) {
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const workload = highPriorityCount > 3 ? 'overloaded' : 
                    highPriorityCount > 1 ? 'balanced' : 'light';

    return {
      workloadAssessment: workload,
      completionPrediction: moment().add(5, 'days').format('YYYY-MM-DD'),
      bottlenecks: ['High priority tasks', 'Deadline conflicts'],
      recommendations: ['Prioritize high-priority tasks', 'Break down complex tasks'],
      riskLevel: highPriorityCount > 3 ? 'high' : 'medium'
    };
  }
}

module.exports = new AIService();

