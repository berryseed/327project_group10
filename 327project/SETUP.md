# 🚀 Setup Guide for AI-Powered Task Planner

## Prerequisites Installation

### 1. Install Node.js and npm

**Option A: Download from Official Website**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the setup wizard
4. Verify installation by opening a new terminal:
   ```bash
   node --version
   npm --version
   ```

**Option B: Using Chocolatey (Windows Package Manager)**
```bash
# Install Chocolatey first (run in PowerShell as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs
```

**Option C: Using Windows Package Manager (winget)**
```bash
winget install OpenJS.NodeJS
```

### 2. Install MySQL

**Option A: Download MySQL Installer**
1. Go to [mysql.com/downloads](https://dev.mysql.com/downloads/installer/)
2. Download MySQL Installer for Windows
3. Run the installer and choose "Developer Default"
4. Set root password during installation
5. Verify installation by opening MySQL Command Line Client

**Option B: Using Chocolatey**
```bash
choco install mysql
```

### 3. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you'll need it for the .env file)

## 🛠️ Project Setup

### 1. Install Dependencies

After installing Node.js, run these commands:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
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

Open MySQL Command Line Client or MySQL Workbench and run:

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

# Start frontend (from frontend directory, in a new terminal)
npm start
```

## 🔧 Troubleshooting

### Common Issues

**1. "npm is not recognized"**
- Node.js not installed or not in PATH
- Restart terminal after installation
- Check if Node.js is in your system PATH

**2. "MySQL connection failed"**
- MySQL service not running
- Wrong password or username
- Database doesn't exist
- Check MySQL service status

**3. "OpenAI API error"**
- Invalid or missing API key
- Insufficient API credits
- Network connectivity issues

**4. "Port already in use"**
- Change PORT in .env file
- Kill process using the port
- Use different port numbers

### Port Conflicts

If you get port conflicts, modify the `.env` file:

```env
PORT=5001  # Change to any available port
```

And update the frontend API calls in `frontend/src/components/AITaskForm.js`:

```javascript
const API_BASE = 'http://localhost:5001'; // Match your backend port
```

## 🚀 Alternative: Quick Start Without Dependencies

If you can't install dependencies right now, you can still explore the code:

1. **Review the AI Service** (`backend/services/aiService.js`)
   - See how AI prompts are structured
   - Understand the fallback mechanisms
   - Learn about the AI analysis logic

2. **Examine the Frontend Components**
   - `frontend/src/components/AITaskForm.js` - AI-powered task creation
   - `frontend/src/components/TaskDashboard.js` - Task management with AI insights
   - `frontend/src/App.js` - Main application structure

3. **Study the API Endpoints** (`backend/server.js`)
   - AI analysis endpoints
   - Task management APIs
   - Database integration

## 📱 Testing the AI Features

Once everything is set up:

1. **Create a task** with detailed description
2. **Use AI Analysis** to get intelligent recommendations
3. **Get Task Suggestions** based on your workload
4. **Analyze Schedule** for optimal task ordering
5. **Review Workload** to identify bottlenecks

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure
- Use strong MySQL passwords
- Consider using environment-specific configurations

## 📞 Getting Help

If you encounter issues:

1. Check the error messages in the terminal
2. Verify all prerequisites are installed
3. Ensure database connection details are correct
4. Check if ports are available
5. Review the README.md for additional details

---

**Happy AI-Powered Task Planning! 🚀🤖**

