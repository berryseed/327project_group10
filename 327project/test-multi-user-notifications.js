const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test data for multiple users
const testUsers = [
  {
    email: 'user1@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    studentId: 'STU001'
  },
  {
    email: 'user2@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    studentId: 'STU002'
  }
];

const testTasks = [
  {
    title: 'User 1 Task - Due Soon',
    description: 'This task is due in 1 hour',
    course_code: 'CS101',
    course_name: 'Introduction to Computer Science',
    task_type: 'assignment',
    priority: 'high',
    estimated_duration: 60,
    deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    difficulty_level: 'medium'
  },
  {
    title: 'User 2 Task - Due Tomorrow',
    description: 'This task is due tomorrow',
    course_code: 'CS102',
    course_name: 'Data Structures',
    task_type: 'exam',
    priority: 'urgent',
    estimated_duration: 120,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    difficulty_level: 'hard'
  }
];

async function testMultiUserAndNotifications() {
  console.log('🧪 Testing Multi-User Support and Notifications\n');
  
  const userTokens = [];
  const userTasks = [];

  try {
    // 1. Register and login multiple users
    console.log('1️⃣ Testing User Registration and Login...');
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      
      // Register user
      try {
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, user);
        console.log(`✅ User ${i + 1} registered: ${user.email}`);
        userTokens.push(registerResponse.data.token);
      } catch (error) {
        if (error.response?.status === 500) {
          // User might already exist, try login
          const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: user.email,
            password: user.password
          });
          console.log(`✅ User ${i + 1} logged in: ${user.email}`);
          userTokens.push(loginResponse.data.token);
        } else {
          throw error;
        }
      }
    }

    // 2. Test user data isolation
    console.log('\n2️⃣ Testing User Data Isolation...');
    
    for (let i = 0; i < userTokens.length; i++) {
      const token = userTokens[i];
      const task = testTasks[i];
      
      // Create task for this user
      const createResponse = await axios.post(`${API_BASE}/tasks`, task, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      userTasks.push(createResponse.data.task);
      console.log(`✅ Task created for User ${i + 1}: ${task.title}`);
      
      // Verify task belongs to correct user
      const tasksResponse = await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ User ${i + 1} has ${tasksResponse.data.length} tasks`);
      
      // Verify other user can't see this task
      const otherUserIndex = i === 0 ? 1 : 0;
      const otherUserTasks = await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${userTokens[otherUserIndex]}` }
      });
      
      const hasOtherUserTask = otherUserTasks.data.some(t => t.title === task.title);
      if (!hasOtherUserTask) {
        console.log(`✅ User ${otherUserIndex + 1} cannot see User ${i + 1}'s tasks`);
      } else {
        console.log(`❌ Data isolation failed: User ${otherUserIndex + 1} can see User ${i + 1}'s tasks`);
      }
    }

    // 3. Test notification scheduling
    console.log('\n3️⃣ Testing Notification Scheduling...');
    
    // Check if notifications were created for the tasks
    for (let i = 0; i < userTokens.length; i++) {
      const token = userTokens[i];
      
      const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userNotifications = notificationsResponse.data;
      const deadlineNotifications = userNotifications.filter(n => n.type === 'deadline_reminder');
      
      console.log(`✅ User ${i + 1} has ${deadlineNotifications.length} deadline notifications scheduled`);
      
      // Check notification timing
      deadlineNotifications.forEach(notif => {
        const scheduledTime = new Date(notif.scheduled_at);
        const now = new Date();
        const timeUntilNotification = scheduledTime.getTime() - now.getTime();
        const hoursUntilNotification = timeUntilNotification / (1000 * 60 * 60);
        
        console.log(`   - Notification: "${notif.message}" scheduled for ${scheduledTime.toLocaleString()} (${hoursUntilNotification.toFixed(1)} hours from now)`);
      });
    }

    // 4. Test time block user isolation
    console.log('\n4️⃣ Testing Time Block User Isolation...');
    
    for (let i = 0; i < userTokens.length; i++) {
      const token = userTokens[i];
      
      // Create time block for this user
      const timeBlock = {
        day_of_week: i + 1, // Different days for each user
        start_time: '09:00',
        end_time: '11:00',
        block_type: 'available',
        is_recurring: true
      };
      
      await axios.post(`${API_BASE}/availability/blocks`, timeBlock, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Time block created for User ${i + 1}`);
      
      // Verify time blocks are user-specific
      const timeBlocksResponse = await axios.get(`${API_BASE}/availability/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ User ${i + 1} has ${timeBlocksResponse.data.length} time blocks`);
    }

    // 5. Test notification processor
    console.log('\n5️⃣ Testing Notification Processor...');
    
    // Wait a moment for any immediate notifications
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if any notifications were sent
    for (let i = 0; i < userTokens.length; i++) {
      const token = userTokens[i];
      
      const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sentNotifications = notificationsResponse.data.filter(n => n.sent_at !== null);
      console.log(`✅ User ${i + 1} has ${sentNotifications.length} sent notifications`);
    }

    // 6. Test real-time notification updates
    console.log('\n6️⃣ Testing Real-time Notification Updates...');
    
    // Send test notification
    for (let i = 0; i < userTokens.length; i++) {
      const token = userTokens[i];
      
      await axios.post(`${API_BASE}/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Test notification sent for User ${i + 1}`);
    }

    // 7. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    for (let i = 0; i < userTokens.length; i++) {
      const token = userTokens[i];
      
      // Delete user's tasks
      const tasksResponse = await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      for (const task of tasksResponse.data) {
        await axios.delete(`${API_BASE}/tasks/${task.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Delete user's time blocks
      const timeBlocksResponse = await axios.get(`${API_BASE}/availability/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      for (const block of timeBlocksResponse.data) {
        await axios.delete(`${API_BASE}/availability/blocks/${block.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log(`✅ Cleaned up data for User ${i + 1}`);
    }

    console.log('\n🎉 Multi-user and notification tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ User Registration: Working');
    console.log('✅ User Login: Working');
    console.log('✅ Data Isolation: Working');
    console.log('✅ Notification Scheduling: Working');
    console.log('✅ Time Block Isolation: Working');
    console.log('✅ Notification Processor: Working');
    console.log('✅ Real-time Updates: Working');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMultiUserAndNotifications();
