# Frontend Component Testing Guide

## Component Functionality Checklist

### 1. Authentication (UserAuth.js)
- [ ] **Login Form**
  - Email validation
  - Password validation
  - Error handling for invalid credentials
  - Success redirect to main app

- [ ] **Registration Form**
  - All required fields (firstName, lastName, email, password)
  - Password confirmation matching
  - Student ID optional field
  - Success redirect to main app

- [ ] **Forgot Password**
  - Email input validation
  - Success message display

- [ ] **Profile Management**
  - View current user info
  - Update profile fields
  - Password change (optional)

### 2. Task Management (AITaskForm.js)
- [ ] **Enhanced Form Fields**
  - Task title (required)
  - Description (required)
  - Course code and name
  - Task type dropdown (assignment, exam, class, study, project, other)
  - Priority level (low, medium, high, urgent)
  - Difficulty level (easy, medium, hard)
  - Estimated duration (15-minute increments)
  - Deadline date/time

- [ ] **AI Features**
  - Task analysis button
  - AI suggestions
  - Schedule recommendations
  - Workload analysis

- [ ] **Form Validation**
  - Required field validation
  - Time format validation
  - Duration validation (15-minute increments)

### 3. Task Dashboard (TaskDashboard.js)
- [ ] **Task Display**
  - All task attributes shown
  - Course code badges
  - Task type badges
  - Priority color coding
  - Status indicators
  - Duration display

- [ ] **Filtering & Search**
  - Priority filter
  - Status filter
  - Search by title/description

- [ ] **Task Actions**
  - Status updates (pending, in-progress, completed)
  - Task deletion with confirmation
  - AI insights display

### 4. Time Block Management (TimeBlockManager.js)
- [ ] **Time Block CRUD**
  - Create recurring time blocks
  - Edit existing blocks
  - Delete blocks with confirmation
  - 15-minute increment validation

- [ ] **Exception Management**
  - Create one-time exceptions
  - Delete exceptions
  - Date/time validation

- [ ] **Class Schedule**
  - Add class schedules
  - Delete class schedules
  - Location tracking

- [ ] **Schedule Validation**
  - Validate Schedule button
  - Conflict detection display
  - Warning messages
  - Suggestions display

### 5. Progress Tracking (ProgressTracker.js)
- [ ] **Key Metrics Display**
  - Task completion rate
  - Time estimation accuracy
  - Total tasks count
  - Completed tasks count

- [ ] **Course Performance**
  - Course-wise completion rates
  - Progress bars
  - Task counts per course

- [ ] **Priority Distribution**
  - Visual priority breakdown
  - Color-coded priority levels

- [ ] **Weekly Trends**
  - Chart visualization
  - Completed vs planned tasks
  - Trend analysis

- [ ] **Productivity Heatmap**
  - 30-day activity grid
  - Color intensity based on activity
  - Hover tooltips

- [ ] **Study Session Analytics**
  - Total sessions count
  - Average duration
  - Total study time
  - Average productivity

### 6. Notification System (NotificationSystem.js)
- [ ] **Notification Display**
  - Unread count indicator
  - Notification list
  - Priority color coding
  - Time ago formatting

- [ ] **Notification Actions**
  - Mark as read
  - Mark all as read
  - Delete notifications
  - Test notification

- [ ] **Settings Management**
  - Notification channels (email, SMS, push)
  - Notification types (deadlines, reminders, etc.)
  - Save settings

### 7. Student Dashboard (StudentDashboard.js)
- [ ] **Feature Overview**
  - Pomodoro timer display
  - Smart scheduling info
  - Progress analytics preview
  - Academic tasks summary

### 8. App Navigation (App.js)
- [ ] **Authentication Gating**
  - Login required to access app
  - Auth screen when not logged in
  - Logout functionality

- [ ] **Navigation**
  - All component navigation works
  - Active state indicators
  - Responsive design

## Testing Steps

### Manual Testing Process

1. **Start the Application**
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend
   cd frontend
   npm start
   ```

2. **Test Authentication Flow**
   - Access app without login (should show auth screen)
   - Register new user
   - Login with credentials
   - Verify access to main app
   - Test logout

3. **Test Task Management**
   - Create task with all fields
   - Verify AI analysis works
   - Update task status
   - Delete task
   - Test filtering and search

4. **Test Time Management**
   - Add recurring time blocks
   - Add one-time exceptions
   - Add class schedules
   - Run schedule validation
   - Verify conflict detection

5. **Test Progress Tracking**
   - View analytics dashboard
   - Check all metrics display
   - Verify chart visualizations
   - Test different time periods

6. **Test Notifications**
   - Send test notification
   - Mark notifications as read
   - Update notification settings
   - Verify real-time updates

### Automated Testing

Run the functionality test:
```bash
cd 327project
node test-functionality.js
```

Run the database verification:
```bash
cd 327project
node verify-database.js
```

## Expected Results

### Database Tables
- ✅ tasks (with all required fields)
- ✅ courses
- ✅ study_sessions
- ✅ user_preferences
- ✅ users
- ✅ notifications
- ✅ time_blocks
- ✅ availability_exceptions
- ✅ class_schedule

### API Endpoints (59 total)
- ✅ Authentication (6 endpoints)
- ✅ Task Management (8 endpoints)
- ✅ Time Management (12 endpoints)
- ✅ AI Features (6 endpoints)
- ✅ Notifications (6 endpoints)
- ✅ Study Sessions (3 endpoints)
- ✅ User Preferences (2 endpoints)
- ✅ Pomodoro Timer (7 endpoints)
- ✅ Course Management (2 endpoints)
- ✅ Schedule Validation (1 endpoint)
- ✅ Progress Tracking (1 endpoint)

### Frontend Components
- ✅ All 8 components functional
- ✅ Authentication gating working
- ✅ Form validation working
- ✅ Real-time updates working
- ✅ Responsive design working

## Common Issues & Solutions

### Database Issues
- **Connection failed**: Check MySQL service and credentials
- **Table not found**: Run the backend to initialize tables
- **Foreign key errors**: Check table creation order

### API Issues
- **CORS errors**: Ensure backend CORS is enabled
- **404 errors**: Check endpoint URLs and methods
- **500 errors**: Check server logs for detailed errors

### Frontend Issues
- **Component not loading**: Check import paths and dependencies
- **State not updating**: Verify useEffect dependencies
- **Form validation**: Check input validation logic

## Performance Considerations

- Database queries are optimized with indexes
- Frontend uses React hooks efficiently
- API responses are properly formatted
- Error handling is comprehensive
- Loading states are implemented

## Security Considerations

- Input validation on both frontend and backend
- SQL injection prevention with parameterized queries
- CORS properly configured
- Authentication tokens handled securely
- Password hashing ready for production
