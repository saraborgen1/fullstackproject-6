import { useState, useEffect, useMemo } from 'react';
import { adminAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';

window.appCache = window.appCache || {};
window.appCache.admin = window.appCache.admin || {};

const SECTION_TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'users', label: 'User Management', icon: '👥' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlocked, setFilterBlocked] = useState('all');
  const [filterAdmin, setFilterAdmin] = useState('all');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/login');
      return;
    }

    const adminCache = window.appCache.admin[user.id];

    if (adminCache) {
      setStats(adminCache.stats);
      setUsers(adminCache.users);
      setLoading(false);
      return;
    }

    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, usersData] = await Promise.all([
        adminAPI.getStatistics(user.id),
        adminAPI.getAllUsers(user.id),
      ]);
      setStats(statsData);
      setUsers(usersData);
      window.appCache.admin[user.id] = {
        stats: statsData,
        users: usersData,
      };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBlocked =
        filterBlocked === 'all' ||
        (filterBlocked === 'blocked' && u.blocked) ||
        (filterBlocked === 'active' && !u.blocked);
      const matchesAdmin =
        filterAdmin === 'all' ||
        (filterAdmin === 'admins' && u.is_admin) ||
        (filterAdmin === 'regular' && !u.is_admin);
      return matchesSearch && matchesBlocked && matchesAdmin;
    });
  }, [users, searchTerm, filterBlocked, filterAdmin]);

  const handleToggleAdmin = async (targetUserId, currentAdminStatus) => {
    if (!window.confirm('Change admin status for this user?')) return;
    try {
      await adminAPI.toggleAdmin(targetUserId, user.id, !currentAdminStatus);
      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === targetUserId ? { ...u, is_admin: !currentAdminStatus } : u
        );

        window.appCache.admin[user.id] = {
          stats: {
            ...stats,
            admins: stats.admins + (!currentAdminStatus ? 1 : -1),
          },
          users: next,
        };

        return next;
      });

      setStats((prev) => ({
        ...prev,
        admins: prev.admins + (!currentAdminStatus ? 1 : -1),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update admin status');
    }
  };

  const handleToggleBlock = async (targetUserId, currentBlocked) => {
    if (!window.confirm('Toggle block status for this user?')) return;
    try {
      await usersAPI.blockUser(targetUserId, !currentBlocked);
      if (targetUserId === user.id) {
        alert('You cannot block yourself from admin view.');
      }
      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === targetUserId ? { ...u, blocked: !currentBlocked } : u
        );

        window.appCache.admin[user.id] = {
          stats: {
            ...stats,
            blockedUsers: stats.blockedUsers + (!currentBlocked ? 1 : -1),
          },
          users: next,
        };

        return next;
      });

      setStats((prev) => ({
        ...prev,
        blockedUsers: prev.blockedUsers + (!currentBlocked ? 1 : -1),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update block status');
    }
  };

  if (!user?.is_admin) return null;

  return (
    <div className="admin-layout">
      {error && <div className="error-msg">{error}</div>}
      {loading && (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <span>Loading admin data...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Admin Header */}
          <h1>
            <Link to={`/users/${username}/dashboard`} className="back-link">
              ←
            </Link>
            Admin Panel
          </h1>

          {/* Section Tabs */}
          <div className="admin-tabs">
            {SECTION_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`admin-tab ${activeSection === tab.key ? 'active' : ''}`}
                onClick={() => setActiveSection(tab.key)}
              >
                <span className="admin-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section Content */}
          {activeSection === 'overview' && stats && (
            <div className="admin-section">
              {/* Top Row - Key Metrics */}
              <div className="admin-overview-top">
                <div className="admin-stat-card admin-stat-primary">
                  <div className="admin-stat-icon-wrapper">
                    <span className="admin-stat-icon">👥</span>
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Total Users</span>
                    <span className="admin-stat-number">{stats.users}</span>
                    <span className="admin-stat-detail">
                      {stats.blockedUsers} blocked · {stats.admins} admins
                    </span>
                  </div>
                </div>
                <div className="admin-stat-card admin-stat-success">
                  <div className="admin-stat-icon-wrapper">
                    <span className="admin-stat-icon">✅</span>
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Completed Todos</span>
                    <span className="admin-stat-number">{stats.completedTodos}</span>
                    <span className="admin-stat-detail">
                      of {stats.todos} total · {stats.todos > 0 ? Math.round((stats.completedTodos / stats.todos) * 100) : 0}% completion
                    </span>
                  </div>
                </div>
                <div className="admin-stat-card admin-stat-warning">
                  <div className="admin-stat-icon-wrapper">
                    <span className="admin-stat-icon">💬</span>
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Comments</span>
                    <span className="admin-stat-number">{stats.comments}</span>
                    <span className="admin-stat-detail">on {stats.posts} posts</span>
                  </div>
                </div>
                <div className="admin-stat-card admin-stat-info">
                  <div className="admin-stat-icon-wrapper">
                    <span className="admin-stat-icon">📁</span>
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Albums</span>
                    <span className="admin-stat-number">{stats.albums}</span>
                    <span className="admin-stat-detail">{stats.photos} photos</span>
                  </div>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="admin-detail-grid">
                <div className="admin-detail-card">
                  <div className="admin-detail-card-header">
                    <h3>📊 Todos Progress</h3>
                  </div>
                  <div className="admin-detail-card-body">
                    <div className="admin-progress-container">
                      <div className="admin-progress-bar">
                        <div
                          className="admin-progress-fill"
                          style={{
                            width: stats.todos > 0
                              ? `${Math.round((stats.completedTodos / stats.todos) * 100)}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="admin-progress-label">
                        {stats.todos > 0
                          ? `${Math.round((stats.completedTodos / stats.todos) * 100)}% complete`
                          : 'No todos'}
                      </span>
                    </div>
                    <div className="admin-detail-stats">
                      <div className="admin-detail-stat">
                        <span className="admin-detail-stat-value">{stats.todos}</span>
                        <span className="admin-detail-stat-label">Total</span>
                      </div>
                      <div className="admin-detail-stat">
                        <span className="admin-detail-stat-value">{stats.completedTodos}</span>
                        <span className="admin-detail-stat-label">Done</span>
                      </div>
                      <div className="admin-detail-stat">
                        <span className="admin-detail-stat-value">
                          {stats.todos - stats.completedTodos}
                        </span>
                        <span className="admin-detail-stat-label">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-card-header">
                    <h3>👥 User Breakdown</h3>
                  </div>
                  <div className="admin-detail-card-body">
                    <div className="admin-user-breakdown">
                      <div className="admin-breakdown-item">
                        <div className="admin-breakdown-color" style={{ background: 'var(--primary)' }} />
                        <span className="admin-breakdown-label">Regular Users</span>
                        <span className="admin-breakdown-value">{stats.users - stats.admins}</span>
                      </div>
                      <div className="admin-breakdown-item">
                        <div className="admin-breakdown-color" style={{ background: '#f59e0b' }} />
                        <span className="admin-breakdown-label">Admins</span>
                        <span className="admin-breakdown-value">{stats.admins}</span>
                      </div>
                      <div className="admin-breakdown-item">
                        <div className="admin-breakdown-color" style={{ background: 'var(--danger)' }} />
                        <span className="admin-breakdown-label">Blocked</span>
                        <span className="admin-breakdown-value">{stats.blockedUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-card-header">
                    <h3>🌐 Platform Content</h3>
                  </div>
                  <div className="admin-detail-card-body">
                    <div className="admin-content-summary">
                      <div className="admin-content-item">
                        <span className="admin-content-icon">📝</span>
                        <span className="admin-content-label">Posts</span>
                        <span className="admin-content-value">{stats.posts}</span>
                      </div>
                      <div className="admin-content-item">
                        <span className="admin-content-icon">💬</span>
                        <span className="admin-content-label">Comments</span>
                        <span className="admin-content-value">{stats.comments}</span>
                      </div>
                      <div className="admin-content-item">
                        <span className="admin-content-icon">📁</span>
                        <span className="admin-content-label">Albums</span>
                        <span className="admin-content-value">{stats.albums}</span>
                      </div>
                      <div className="admin-content-item">
                        <span className="admin-content-icon">📷</span>
                        <span className="admin-content-label">Photos</span>
                        <span className="admin-content-value">{stats.photos}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="admin-section">
              <div className="admin-users-panel">
                {/* User Management Header */}
                <div className="admin-users-header">
                  <div className="admin-users-header-left">
                    <span className="admin-users-count">{filteredUsers.length} users</span>
                  </div>
                  <div className="admin-users-filters">
                    <input
                      type="text"
                      placeholder="🔍  Search by name, username or email..."
                      className="admin-search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                      className="admin-filter-select"
                      value={filterBlocked}
                      onChange={(e) => setFilterBlocked(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <select
                      className="admin-filter-select"
                      value={filterAdmin}
                      onChange={(e) => setFilterAdmin(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="admins">Admins</option>
                      <option value="regular">Regular</option>
                    </select>
                  </div>
                </div>

                {/* User Table with Internal Scrolling */}
                <div className="admin-table-container">
                  {filteredUsers.length === 0 ? (
                    <div className="admin-no-results">
                      <span className="admin-no-results-icon">🔍</span>
                      <p>No users match your filters</p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>User</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className={u.blocked ? 'row-blocked' : ''}>
                            <td className="admin-cell-id">{u.id}</td>
                            <td>
                              <div className="admin-cell-user">
                                <div className="admin-user-avatar">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="admin-user-info">
                                  <span className="admin-user-name">{u.name}</span>
                                  <span className="admin-user-username">@{u.username}</span>
                                </div>
                              </div>
                            </td>
                            <td className="admin-cell-email">{u.email}</td>
                            <td>{u.phone?.split(' x')[0]}</td>
                            <td>
                              {u.blocked ? (
                                <span className="admin-status-badge admin-status-blocked">
                                  ⚠ Blocked
                                </span>
                              ) : (
                                <span className="admin-status-badge admin-status-active">
                                  ✓ Active
                                </span>
                              )}
                            </td>
                            <td>
                              {u.is_admin ? (
                                <span className="admin-role-badge admin-role-admin">
                                  🛡️ Admin
                                </span>
                              ) : (
                                <span className="admin-role-badge admin-role-user">
                                  User
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="admin-action-buttons">
                                <button
                                  className="btn-edit"
                                  onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                                  disabled={u.id === user.id}
                                >
                                  {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                                <button
                                  className="btn-delete"
                                  onClick={() => handleToggleBlock(u.id, u.blocked)}
                                  disabled={u.id === user.id}
                                >
                                  {u.blocked ? 'Unblock' : 'Block'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}