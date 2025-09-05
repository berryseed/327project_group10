const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  studentId: 'TEST123'
};

const testTask = {
  title: 'Test Task',
  description: 'This is a test task',
  course_code: 'CS327',
  course_name: 'Software Engineering',
  task_type: 'assignment',
  priority: 'high',
  estimated_duration: 120,
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  difficulty_level: 'medium'
};

const testTimeBlock = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '11:00',
  block_type: 'available',
  is_recurring: true
};

const testClassSchedule = {
  course_code: 'CS327',
  day_of_week: 1,
  start_time: '14:00',
  end_time: '16:00',
  location: 'Room 101'
};

async function testFunctionality() {
  console.log('🧪 Starting Comprehensive Functionality Test\n');
  
  let authToken = null;
  let testTaskId = null;
  let testTimeBlockId = null;
  let testClassId = null;
  let testNotificationId = null;

  try {
    // 1. Test Authentication
    console.log('1️⃣ Testing Authentication...');
    
    // Register user
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ User registration successful');
      authToken = registerResponse.data.token;
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('⚠️ User might already exist, trying login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        console.log('✅ User login successful');
        authToken = loginResponse.data.token;
      } else {
        throw error;
      }
    }

    // Test auth check
    const authCheckResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Auth check successful');

    // 2. Test Task Management
    console.log('\n2️⃣ Testing Task Management...');
    
    // Create task
    const createTaskResponse = await axios.post(`${API_BASE}/tasks`, testTask);
    testTaskId = createTaskResponse.data.task?.id;
    console.log('✅ Task creation successful');

    // Get all tasks
    const getTasksResponse = await axios.get(`${API_BASE}/tasks`);
    console.log(`✅ Retrieved ${getTasksResponse.data.length} tasks`);

    // Update task
    const updateTaskResponse = await axios.put(`${API_BASE}/tasks/${testTaskId}`, {
      status: 'in-progress'
    });
    console.log('✅ Task update successful');

    // 3. Test Time Block Management
    console.log('\n3️⃣ Testing Time Block Management...');
    
    // Create time block
    const createTimeBlockResponse = await axios.post(`${API_BASE}/availability/blocks`, testTimeBlock);
    testTimeBlockId = createTimeBlockResponse.data.block?.id;
    console.log('✅ Time block creation successful');

    // Get time blocks
    const getTimeBlocksResponse = await axios.get(`${API_BASE}/availability/blocks`);
    console.log(`✅ Retrieved ${getTimeBlocksResponse.data.length} time blocks`);

    // 4. Test Class Schedule
    console.log('\n4️⃣ Testing Class Schedule...');
    
    // Create class schedule
    const createClassResponse = await axios.post(`${API_BASE}/class-schedule`, testClassSchedule);
    testClassId = createClassResponse.data.entry?.id;
    console.log('✅ Class schedule creation successful');

    // Get class schedule
    const getClassResponse = await axios.get(`${API_BASE}/class-schedule`);
    console.log(`✅ Retrieved ${getClassResponse.data.length} class schedules`);

    // 5. Test Schedule Validation
    console.log('\n5️⃣ Testing Schedule Validation...');
    
    const validationResponse = await axios.post(`${API_BASE}/scheduler/validate`, {
      candidateSchedule: [{
        date: new Date().toISOString().split('T')[0],
        start: '09:00',
        end: '11:00',
        label: 'Test Session'
      }]
    });
    console.log('✅ Schedule validation successful');
    console.log(`   Conflicts: ${validationResponse.data.conflicts?.length || 0}`);
    console.log(`   Warnings: ${validationResponse.data.warnings?.length || 0}`);

    // 6. Test Study Sessions
    console.log('\n6️⃣ Testing Study Sessions...');
    
    // Record study session
    const studySessionResponse = await axios.post(`${API_BASE}/study-sessions`, {
      task_id: testTaskId,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      duration: 120,
      session_type: 'study',
      productivity_score: 85,
      notes: 'Test study session'
    });
    console.log('✅ Study session recording successful');

    // Get study sessions
    const getStudySessionsResponse = await axios.get(`${API_BASE}/study-sessions`);
    console.log(`✅ Retrieved ${getStudySessionsResponse.data.length} study sessions`);

    // 7. Test Notifications
    console.log('\n7️⃣ Testing Notifications...');
    
    // Send test notification
    const testNotificationResponse = await axios.post(`${API_BASE}/notifications/test`);
    testNotificationId = testNotificationResponse.data.notification?.id;
    console.log('✅ Test notification sent');

    // Get notifications
    const getNotificationsResponse = await axios.get(`${API_BASE}/notifications`);
    console.log(`✅ Retrieved ${getNotificationsResponse.data.length} notifications`);

    // 8. Test AI Features
    console.log('\n8️⃣ Testing AI Features...');
    
    // AI task analysis
    const aiAnalysisResponse = await axios.post(`${API_BASE}/ai/analyze-task`, {
      title: 'AI Test Task',
      description: 'Testing AI analysis functionality',
      priority: 'medium'
    });
    console.log('✅ AI task analysis successful');

    // AI workload analysis
    const workloadAnalysisResponse = await axios.post(`${API_BASE}/ai/workload-analysis`, {
      tasks: [testTask],
      userProductivity: { averageTasksPerDay: 3, preferredWorkTime: 'morning' }
    });
    console.log('✅ AI workload analysis successful');

    // 9. Test User Preferences
    console.log('\n9️⃣ Testing User Preferences...');
    
    // Get user preferences
    const getPrefsResponse = await axios.get(`${API_BASE}/user-preferences`);
    console.log('✅ User preferences retrieval successful');

    // Update user preferences
    const updatePrefsResponse = await axios.put(`${API_BASE}/user-preferences`, {
      work_hours: { start: '08:00', end: '18:00' },
      break_duration: 20
    });
    console.log('✅ User preferences update successful');

    // 10. Test Pomodoro Timer
    console.log('\n🔟 Testing Pomodoro Timer...');
    
    // Start pomodoro session
    const pomodoroResponse = await axios.post(`${API_BASE}/pomodoro/start`, {
      task_id: testTaskId,
      duration: 25
    });
    console.log('✅ Pomodoro session started');

    // Get active sessions
    const activeSessionsResponse = await axios.get(`${API_BASE}/pomodoro/active`);
    console.log(`✅ Retrieved ${activeSessionsResponse.data.sessions?.length || 0} active sessions`);

    // 11. Test Course Management
    console.log('\n1️⃣1️⃣ Testing Course Management...');
    
    // Create course
    const createCourseResponse = await axios.post(`${API_BASE}/courses`, {
      course_code: 'CS327',
      course_name: 'Software Engineering',
      subject: 'Computer Science',
      semester: 'Fall 2024',
      academic_year: '2024',
      credits: 3,
      instructor: 'Dr. Smith'
    });
    console.log('✅ Course creation successful');

    // Get courses
    const getCoursesResponse = await axios.get(`${API_BASE}/courses`);
    console.log(`✅ Retrieved ${getCoursesResponse.data.length} courses`);

    // 12. Test Progress Tracking
    console.log('\n1️⃣2️⃣ Testing Progress Tracking...');
    
    // Get study statistics
    const statsResponse = await axios.get(`${API_BASE}/study-statistics/30`);
    console.log('✅ Study statistics retrieval successful');

    // 13. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    if (testTaskId) {
      await axios.delete(`${API_BASE}/tasks/${testTaskId}`);
      console.log('✅ Test task deleted');
    }
    
    if (testTimeBlockId) {
      await axios.delete(`${API_BASE}/availability/blocks/${testTimeBlockId}`);
      console.log('✅ Test time block deleted');
    }
    
    if (testClassId) {
      await axios.delete(`${API_BASE}/class-schedule/${testClassId}`);
      console.log('✅ Test class schedule deleted');
    }
    
    if (testNotificationId) {
      await axios.delete(`${API_BASE}/notifications/${testNotificationId}`);
      console.log('✅ Test notification deleted');
    }

    console.log('\n🎉 All functionality tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Authentication: Working');
    console.log('✅ Task Management: Working');
    console.log('✅ Time Block Management: Working');
    console.log('✅ Class Schedule: Working');
    console.log('✅ Schedule Validation: Working');
    console.log('✅ Study Sessions: Working');
    console.log('✅ Notifications: Working');
    console.log('✅ AI Features: Working');
    console.log('✅ User Preferences: Working');
    console.log('✅ Pomodoro Timer: Working');
    console.log('✅ Course Management: Working');
    console.log('✅ Progress Tracking: Working');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFunctionality();
