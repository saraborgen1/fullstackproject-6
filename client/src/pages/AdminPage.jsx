import { useState, useEffect } from 'react';
import { adminAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const cachedAdminDataByUser = {};

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/login');
      return;
    }

    const adminCache = cachedAdminDataByUser[user.id];

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
      cachedAdminDataByUser[user.id] = {
        stats: statsData,
        users: usersData,
      };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (targetUserId, currentAdminStatus) => {
    if (!window.confirm('Change admin status for this user?')) return;
    try {
      await adminAPI.toggleAdmin(targetUserId, user.id, !currentAdminStatus);
      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === targetUserId ? { ...u, is_admin: !currentAdminStatus } : u
        );

        cachedAdminDataByUser[user.id] = {
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

        cachedAdminDataByUser[user.id] = {
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
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Loading admin data...</div>}

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card"><h3>Users</h3><p className="stat-number">{stats.users}</p></div>
          <div className="stat-card"><h3>Blocked</h3><p className="stat-number">{stats.blockedUsers}</p></div>
          <div className="stat-card"><h3>Admins</h3><p className="stat-number">{stats.admins}</p></div>
          <div className="stat-card"><h3>Todos</h3><p className="stat-number">{stats.todos}<br />{stats.completedTodos} done</p></div>
          <div className="stat-card"><h3>Posts</h3><p className="stat-number">{stats.posts}</p></div>
          <div className="stat-card"><h3>Comments</h3><p className="stat-number">{stats.comments}</p></div>
          <div className="stat-card"><h3>Albums</h3><p className="stat-number">{stats.albums}</p></div>
          <div className="stat-card"><h3>Photos</h3><p className="stat-number">{stats.photos}</p></div>
        </div>
      )}

      <h2>User Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Blocked</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={u.blocked ? 'row-blocked' : ''}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.blocked ? '⚠ Blocked' : '—'}</td>
              <td>{u.is_admin ? '✓ Admin' : '—'}</td>
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}