import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    studentId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        setUser(response.data.user);
        setIsLoggedIn(true);
        setShowLogin(false);
        setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', studentId: '' });
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentId: formData.studentId
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        setUser(response.data.user);
        setIsLoggedIn(true);
        setShowRegister(false);
        setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', studentId: '' });
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, {
        email: formData.email
      });

      if (response.data.success) {
        alert('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
        setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', studentId: '' });
      } else {
        setError(response.data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.put(`${API_BASE}/auth/profile`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
        alert('Profile updated successfully!');
      } else {
        setError(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>👤 User Profile</h2>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <div>
              <h3>Profile Information</h3>
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "5px" }}>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Name:</strong> {user?.firstName} {user?.lastName}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Email:</strong> {user?.email}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Student ID:</strong> {user?.studentId || 'Not provided'}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
                <div>
                  <strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}
                </div>
              </div>
            </div>

            <div>
              <h3>Update Profile</h3>
              <form onSubmit={updateProfile}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>First Name:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || user?.firstName || ''}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Last Name:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || user?.lastName || ''}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Student ID:</label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId || user?.studentId || ''}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>New Password (optional):</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                {error && (
                  <div style={{ color: "#dc3545", marginBottom: "15px", padding: "10px", background: "#f8d7da", borderRadius: "5px" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: loading ? "#6c757d" : "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2>🔐 User Authentication</h2>
          <p style={{ color: "#666" }}>Sign in to access your personalized task management system</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
          <button
            onClick={() => { setShowLogin(true); setShowRegister(false); setShowForgotPassword(false); setError(''); }}
            style={{
              padding: "15px 30px",
              background: showLogin ? "#007bff" : "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Login
          </button>
          <button
            onClick={() => { setShowRegister(true); setShowLogin(false); setShowForgotPassword(false); setError(''); }}
            style={{
              padding: "15px 30px",
              background: showRegister ? "#28a745" : "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {showLogin && (
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h3>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ textAlign: "center", marginBottom: "15px" }}>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setShowLogin(false); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div style={{ color: "#dc3545", marginBottom: "15px", padding: "10px", background: "#f8d7da", borderRadius: "5px" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: loading ? "#6c757d" : "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        )}

        {/* Register Form */}
        {showRegister && (
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h3>
            <form onSubmit={handleRegister}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>First Name:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Last Name:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Student ID:</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Confirm Password:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              {error && (
                <div style={{ color: "#dc3545", marginBottom: "15px", padding: "10px", background: "#f8d7da", borderRadius: "5px" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: loading ? "#6c757d" : "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Forgot Password</h3>
            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              {error && (
                <div style={{ color: "#dc3545", marginBottom: "15px", padding: "10px", background: "#f8d7da", borderRadius: "5px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setShowLogin(true); }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#6c757d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: loading ? "#6c757d" : "#ffc107",
                    color: "#000",
                    border: "none",
                    borderRadius: "5px",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAuth;
