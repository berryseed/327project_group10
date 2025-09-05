import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({
    email: true,
    sms: false,
    push: true,
    deadlineReminders: true,
    studyReminders: true,
    overdueAlerts: true,
    dailySummaries: true,
    weeklyReports: true
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);


  useEffect(() => {
    fetchData();
    // Set up real-time notifications (mock)
    const interval = setInterval(checkForNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, notificationsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/notifications')
      ]);
      
      setTasks(tasksRes.data);
      setNotifications(notificationsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const checkForNotifications = () => {
    // Mock notification checking
    const now = new Date();
    const upcomingDeadlines = tasks.filter(task => {
      if (!task.deadline || task.status === 'completed') return false;
      const deadline = new Date(task.deadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
    });

    const overdueTasks = tasks.filter(task => {
      if (!task.deadline || task.status === 'completed') return false;
      const deadline = new Date(task.deadline);
      return deadline < now;
    });

    // Generate mock notifications
    const newNotifications = [];
    
    upcomingDeadlines.forEach(task => {
      const deadline = new Date(task.deadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      
      if (hoursUntilDeadline <= 2 && !notifications.find(n => n.task_id === task.id && n.type === 'deadline_reminder')) {
        newNotifications.push({
          id: Date.now() + Math.random(),
          type: 'deadline_reminder',
          title: 'Deadline Approaching',
          message: `${task.title} is due in ${Math.round(hoursUntilDeadline)} hours`,
          task_id: task.id,
          priority: 'high',
          created_at: new Date().toISOString(),
          read: false
        });
      }
    });

    overdueTasks.forEach(task => {
      if (!notifications.find(n => n.task_id === task.id && n.type === 'overdue_alert')) {
        newNotifications.push({
          id: Date.now() + Math.random(),
          type: 'overdue_alert',
          title: 'Task Overdue',
          message: `${task.title} is overdue`,
          task_id: task.id,
          priority: 'urgent',
          created_at: new Date().toISOString(),
          read: false
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await api.put('/notification-settings', newSettings);
      setSettings(newSettings);
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update notification settings');
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/notifications/test');
      alert('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline_reminder': return '⏰';
      case 'overdue_alert': return '🚨';
      case 'study_reminder': return '📚';
      case 'daily_summary': return '📊';
      case 'weekly_report': return '📈';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Loading notifications...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>🔔 Notifications & Alerts</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "10px 20px",
                background: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={sendTestNotification}
              style={{
                padding: "10px 20px",
                background: "#17a2b8",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              🧪 Test
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: "10px 20px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                ✅ Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Notification Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔔</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1976d2" }}>{notifications.length}</div>
            <div style={{ color: "#666" }}>Total Notifications</div>
          </div>
          
          <div style={{ background: "#fff3e0", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📬</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f57c00" }}>{unreadCount}</div>
            <div style={{ color: "#666" }}>Unread Notifications</div>
          </div>
          
          <div style={{ background: "#e8f5e8", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏰</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#388e3c" }}>
              {tasks.filter(t => t.deadline && new Date(t.deadline) > new Date() && t.status !== 'completed').length}
            </div>
            <div style={{ color: "#666" }}>Upcoming Deadlines</div>
          </div>
          
          <div style={{ background: "#ffebee", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🚨</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d32f2f" }}>
              {tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length}
            </div>
            <div style={{ color: "#666" }}>Overdue Tasks</div>
          </div>
        </div>

        {/* Notifications List */}
        <div>
          <h3>Recent Notifications</h3>
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🔕</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    background: notification.read ? "#f8f9fa" : "#fff",
                    padding: "15px",
                    borderRadius: "5px",
                    border: "1px solid #e9ecef",
                    borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: notification.read ? 0.7 : 1
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                    <div style={{ fontSize: "1.5rem" }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                        {notification.title}
                        {!notification.read && <span style={{ marginLeft: "10px", fontSize: "12px", color: "#dc3545" }}>●</span>}
                      </div>
                      <div style={{ color: "#666", marginBottom: "5px" }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: "12px", color: "#999" }}>
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        style={{
                          padding: "5px 10px",
                          background: "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      style={{
                        padding: "5px 10px",
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "10px",
            width: "500px",
            maxWidth: "90vw"
          }}>
            <h3>Notification Settings</h3>
            <form onSubmit={(e) => { e.preventDefault(); updateSettings(settings); }}>
              <div style={{ marginBottom: "20px" }}>
                <h4>Notification Channels</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.checked }))}
                    />
                    📧 Email Notifications
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.sms}
                      onChange={(e) => setSettings(prev => ({ ...prev, sms: e.target.checked }))}
                    />
                    📱 SMS Notifications
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => setSettings(prev => ({ ...prev, push: e.target.checked }))}
                    />
                    🔔 Push Notifications
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h4>Notification Types</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.deadlineReminders}
                      onChange={(e) => setSettings(prev => ({ ...prev, deadlineReminders: e.target.checked }))}
                    />
                    ⏰ Deadline Reminders
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.studyReminders}
                      onChange={(e) => setSettings(prev => ({ ...prev, studyReminders: e.target.checked }))}
                    />
                    📚 Study Session Reminders
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.overdueAlerts}
                      onChange={(e) => setSettings(prev => ({ ...prev, overdueAlerts: e.target.checked }))}
                    />
                    🚨 Overdue Task Alerts
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.dailySummaries}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailySummaries: e.target.checked }))}
                    />
                    📊 Daily Schedule Summaries
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={settings.weeklyReports}
                      onChange={(e) => setSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                    />
                    📈 Weekly Productivity Reports
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#6c757d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
