# 🚀 Intelligent Task Planner - AI-Powered Decision Making & Planning

A comprehensive task management application that leverages artificial intelligence to provide intelligent task analysis, scheduling recommendations, and workload optimization.

## ✨ AI-Powered Features

### 🤖 **Smart Task Analysis**
- **Priority Optimization**: AI analyzes task content and suggests optimal priority levels with reasoning
- **Deadline Recommendations**: Intelligent deadline adjustments based on task complexity and workload
- **Time Estimation**: AI-powered completion time estimates for better planning
- **Subtask Breakdown**: Automatic suggestion of logical subtasks for complex projects
- **Risk Assessment**: Identification of potential bottlenecks and dependencies

### 💡 **Intelligent Task Suggestions**
- **Pattern Recognition**: AI analyzes your task history to suggest related tasks
- **Logical Next Steps**: Recommendations based on project management best practices
- **Workload Balancing**: Suggestions that complement your existing task portfolio

### 📅 **Smart Scheduling**
- **Optimal Task Order**: AI recommends the best sequence for task completion
- **Daily Planning**: Intelligent daily schedule suggestions
- **Workload Distribution**: Balanced task allocation across time periods
- **Conflict Detection**: Identifies potential scheduling conflicts

### 📊 **Workload Analytics**
- **Capacity Assessment**: Evaluate if you're overloaded, balanced, or underutilized
- **Completion Prediction**: Forecast when all tasks will likely be completed
- **Bottleneck Identification**: Spot potential roadblocks in your workflow
- **Risk Analysis**: Assess the risk level of your current workload

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **MySQL** database for data persistence
- **OpenAI GPT-3.5** for natural language processing and AI analysis
- **Natural.js** for text analysis and processing
- **Moment.js** for date handling and calculations

### Frontend
- **React.js** with modern hooks and functional components
- **Axios** for HTTP client communication
- **Responsive design** with modern CSS styling

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- OpenAI API key

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd 327project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskplanner

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

```sql
-- Create the database
CREATE DATABASE taskplanner;

-- Use the database
USE taskplanner;

-- Create tasks table
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline DATETIME,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
  ai_analysis JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. Start the Application

```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🎯 How to Use

### 1. **AI Task Form** 🤖
- Enter task details (title, description, deadline, priority)
- Use AI analysis to get intelligent recommendations
- Get task suggestions based on your workload
- Receive schedule optimization tips
- Analyze your overall workload capacity

### 2. **Task Dashboard** 📋
- View all tasks with AI insights
- Filter tasks by priority, status, or search terms
- Update task status (pending → in-progress → completed)
- Get AI-powered workload analysis
- Manage and organize your task portfolio

### 3. **Basic Form** 📝
- Simple task creation without AI features
- Quick task entry for simple items

## 🔧 API Endpoints

### Core Task Management
- `GET /tasks` - Retrieve all tasks
- `POST /tasks` - Create a new task
- `PUT /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task

### AI-Powered Features
- `POST /ai/analyze-task` - Get AI analysis for a task
- `POST /ai/schedule-recommendations` - Get scheduling recommendations
- `POST /ai/task-suggestions` - Get AI-generated task suggestions
- `POST /ai/workload-analysis` - Analyze overall workload
- `POST /ai/enhanced-task` - Create task with AI analysis

## 🎨 Customization

### AI Analysis Prompts
Modify the prompts in `backend/services/aiService.js` to customize:
- Task analysis criteria
- Priority assessment logic
- Scheduling recommendations
- Workload analysis parameters

### User Preferences
The system supports user preferences for:
- Work hours and preferred days
- Productivity patterns
- Task completion rates
- Risk tolerance levels

## 🔒 Security & Privacy

- **Environment Variables**: Sensitive data stored in `.env` files
- **Input Validation**: All user inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **API Rate Limiting**: Built-in protection against API abuse

## 🚧 Fallback Mechanisms

The system includes intelligent fallback when AI services are unavailable:
- **Priority Logic**: Rule-based priority assignment
- **Schedule Optimization**: Basic sorting algorithms
- **Workload Analysis**: Statistical analysis of task data
- **Task Suggestions**: Pattern-based recommendations

## 📈 Performance Optimization

- **Caching**: AI analysis results cached for similar tasks
- **Batch Processing**: Multiple AI requests processed efficiently
- **Async Operations**: Non-blocking AI analysis
- **Database Indexing**: Optimized database queries

## 🔮 Future Enhancements

- **Machine Learning**: User behavior pattern learning
- **Predictive Analytics**: Advanced workload forecasting
- **Integration APIs**: Connect with calendar and project management tools
- **Mobile App**: React Native mobile application
- **Team Collaboration**: Multi-user task management
- **Advanced AI Models**: GPT-4 integration and custom fine-tuning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ and 🤖 AI for intelligent task planning and decision making**

