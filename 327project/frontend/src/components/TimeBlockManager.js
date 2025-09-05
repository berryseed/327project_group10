import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TimeBlockManager = () => {
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [classSchedule, setClassSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showAddException, setShowAddException] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    block_type: 'available',
    is_recurring: true,
    start_date: '',
    end_date: '',
    course_code: '',
    location: '',
    recurring_start: '',
    recurring_end: ''
  });
  const [validation, setValidation] = useState({ conflicts: [], warnings: [], suggestions: [] });

  const API_BASE = 'http://localhost:5000';

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [blocksRes, exceptionsRes, classesRes] = await Promise.all([
        axios.get(`${API_BASE}/availability/blocks`),
        axios.get(`${API_BASE}/availability/exceptions`),
        axios.get(`${API_BASE}/class-schedule`)
      ]);
      
      setTimeBlocks(blocksRes.data);
      setExceptions(exceptionsRes.data);
      setClassSchedule(classesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const validateSchedule = async () => {
    try {
      // Build a simple candidate schedule from class schedule and preferred/available blocks
      const today = new Date();
      const toISODate = (d) => d.toISOString().split('T')[0];
      const next7 = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      });
      const candidate = [];
      next7.forEach(d => {
        const day = d.getDay();
        classSchedule.filter(c => c.day_of_week === day).forEach(c => {
          candidate.push({ date: toISODate(d), start: c.start_time, end: c.end_time, label: `Class ${c.course_code}` });
        });
      });

      const response = await axios.post(`${API_BASE}/scheduler/validate`, { candidateSchedule: candidate });
      setValidation(response.data);
      if (response.data.conflicts?.length === 0 && response.data.warnings?.length === 0) {
        alert('Schedule looks good! No conflicts or warnings found.');
      }
    } catch (error) {
      console.error('Error validating schedule:', error);
      alert('Failed to validate schedule');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addTimeBlock = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/availability/blocks`, formData);
      setShowAddBlock(false);
      fetchData();
      setFormData({
        day_of_week: 0,
        start_time: '09:00',
        end_time: '10:00',
        block_type: 'available',
        is_recurring: true,
        start_date: '',
        end_date: '',
        course_code: '',
        location: '',
        recurring_start: '',
        recurring_end: ''
      });
    } catch (error) {
      console.error('Error adding time block:', error);
      alert('Failed to add time block');
    }
  };

  const addException = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/availability/exceptions`, {
        date: formData.start_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        block_type: formData.block_type,
        reason: formData.course_code || 'Exception'
      });
      setShowAddException(false);
      fetchData();
    } catch (error) {
      console.error('Error adding exception:', error);
      alert('Failed to add exception');
    }
  };

  const addClassSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/class-schedule`, {
        course_code: formData.course_code,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        recurring_start: formData.recurring_start,
        recurring_end: formData.recurring_end
      });
      setShowAddClass(false);
      fetchData();
    } catch (error) {
      console.error('Error adding class schedule:', error);
      alert('Failed to add class schedule');
    }
  };

  const deleteTimeBlock = async (id) => {
    if (window.confirm('Are you sure you want to delete this time block?')) {
      try {
        await axios.delete(`${API_BASE}/availability/blocks/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting time block:', error);
        alert('Failed to delete time block');
      }
    }
  };

  const deleteException = async (id) => {
    if (window.confirm('Are you sure you want to delete this exception?')) {
      try {
        await axios.delete(`${API_BASE}/availability/exceptions/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting exception:', error);
        alert('Failed to delete exception');
      }
    }
  };

  const deleteClassSchedule = async (id) => {
    if (window.confirm('Are you sure you want to delete this class schedule?')) {
      try {
        await axios.delete(`${API_BASE}/class-schedule/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting class schedule:', error);
        alert('Failed to delete class schedule');
      }
    }
  };

  const getBlockTypeColor = (type) => {
    switch (type) {
      case 'preferred': return '#28a745';
      case 'available': return '#17a2b8';
      case 'unavailable': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Loading time management data...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>⏰ Time Block Management</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={validateSchedule}
              style={{
                padding: "10px 20px",
                background: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              ✅ Validate Schedule
            </button>
            <button
              onClick={() => setShowAddBlock(true)}
              style={{
                padding: "10px 20px",
                background: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              ➕ Add Time Block
            </button>
            <button
              onClick={() => setShowAddException(true)}
              style={{
                padding: "10px 20px",
                background: "#ffc107",
                color: "#000",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              📅 Add Exception
            </button>
            <button
              onClick={() => setShowAddClass(true)}
              style={{
                padding: "10px 20px",
                background: "#6f42c1",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              🎓 Add Class
            </button>
          </div>
        </div>

        {/* Time Blocks */}
        <div style={{ marginBottom: "30px" }}>
          <h3>📅 Recurring Time Blocks</h3>
          {timeBlocks.length === 0 ? (
            <p style={{ color: "#6c757d", textAlign: "center", padding: "20px" }}>No time blocks defined</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {timeBlocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    background: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "5px",
                    border: "1px solid #e9ecef",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong>{days[block.day_of_week]}</strong> - {block.start_time} to {block.end_time}
                    <span style={{
                      marginLeft: "10px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                      background: getBlockTypeColor(block.block_type)
                    }}>
                      {block.block_type}
                    </span>
                    {block.is_recurring && <span style={{ marginLeft: "10px", color: "#6c757d" }}>🔄 Recurring</span>}
                  </div>
                  <button
                    onClick={() => deleteTimeBlock(block.id)}
                    style={{
                      padding: "5px 10px",
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exceptions */}
        <div style={{ marginBottom: "30px" }}>
          <h3>📅 One-time Exceptions</h3>
          {exceptions.length === 0 ? (
            <p style={{ color: "#6c757d", textAlign: "center", padding: "20px" }}>No exceptions defined</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  style={{
                    background: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "5px",
                    border: "1px solid #e9ecef",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong>{exception.date}</strong> - {exception.start_time} to {exception.end_time}
                    <span style={{
                      marginLeft: "10px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                      background: getBlockTypeColor(exception.block_type)
                    }}>
                      {exception.block_type}
                    </span>
                    {exception.reason && <span style={{ marginLeft: "10px", color: "#6c757d" }}>({exception.reason})</span>}
                  </div>
                  <button
                    onClick={() => deleteException(exception.id)}
                    style={{
                      padding: "5px 10px",
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Schedule */}
        <div>
          <h3>🎓 Class Schedule</h3>
          {classSchedule.length === 0 ? (
            <p style={{ color: "#6c757d", textAlign: "center", padding: "20px" }}>No class schedule defined</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {classSchedule.map((classItem) => (
                <div
                  key={classItem.id}
                  style={{
                    background: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "5px",
                    border: "1px solid #e9ecef",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong>{classItem.course_code}</strong> - {days[classItem.day_of_week]} {classItem.start_time} to {classItem.end_time}
                    {classItem.location && <span style={{ marginLeft: "10px", color: "#6c757d" }}>📍 {classItem.location}</span>}
                  </div>
                  <button
                    onClick={() => deleteClassSchedule(classItem.id)}
                    style={{
                      padding: "5px 10px",
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {(validation.conflicts?.length || validation.warnings?.length || validation.suggestions?.length) ? (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
          <h3>🧪 Schedule Validation</h3>
          {validation.conflicts?.length > 0 && (
            <div style={{ background: "#ffebee", padding: "15px", borderRadius: "5px", marginBottom: "10px" }}>
              <strong>Conflicts:</strong>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {validation.conflicts.map((c, idx) => (
                  <li key={idx}>{c.reason} ({c.item?.date} {c.item?.start}-{c.item?.end})</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings?.length > 0 && (
            <div style={{ background: "#fff8e1", padding: "15px", borderRadius: "5px", marginBottom: "10px" }}>
              <strong>Warnings:</strong>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {validation.warnings.map((w, idx) => (
                  <li key={idx}>{w.date ? `${w.date}: ` : ''}{w.reason}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.suggestions?.length > 0 && (
            <div style={{ background: "#e3f2fd", padding: "15px", borderRadius: "5px" }}>
              <strong>Suggestions:</strong>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {validation.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Add Time Block Modal */}
      {showAddBlock && (
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
            <h3>Add Time Block</h3>
            <form onSubmit={addTimeBlock}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Day of Week:</label>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  {days.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Start Time:</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    step="900"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>End Time:</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    step="900"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Block Type:</label>
                <select
                  name="block_type"
                  value={formData.block_type}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="preferred">Preferred</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleInputChange}
                  />
                  Recurring Block
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddBlock(false)}
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
                  Add Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exception Modal */}
      {showAddException && (
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
            <h3>Add Exception</h3>
            <form onSubmit={addException}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Date:</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Start Time:</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    step="900"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>End Time:</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    step="900"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Block Type:</label>
                <select
                  name="block_type"
                  value={formData.block_type}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="preferred">Preferred</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Reason:</label>
                <input
                  type="text"
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  placeholder="e.g., Doctor appointment"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddException(false)}
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
                    background: "#ffc107",
                    color: "#000",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Add Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Schedule Modal */}
      {showAddClass && (
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
            <h3>Add Class Schedule</h3>
            <form onSubmit={addClassSchedule}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Course Code:</label>
                <input
                  type="text"
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  placeholder="e.g., CS327"
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Day of Week:</label>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  {days.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Start Time:</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    step="900"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>End Time:</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    step="900"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  placeholder="e.g., Room 101"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Start Date:</label>
                  <input
                    type="date"
                    name="recurring_start"
                    value={formData.recurring_start}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>End Date:</label>
                  <input
                    type="date"
                    name="recurring_end"
                    value={formData.recurring_end}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
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
                    background: "#6f42c1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeBlockManager;
