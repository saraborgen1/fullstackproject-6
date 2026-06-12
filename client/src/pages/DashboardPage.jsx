import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await usersAPI.getDashboard(user.id);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!data) return null;

  const { user: profile, todos, posts, albums } = data;

  return (
    <div className="dashboard">
      <h1>Dashboard — {profile.name}</h1>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Todos</h3>
          <p className="stat-number">{todos.length}</p>
          <p>Completed: {todos.filter((t) => t.completed).length}</p>
          <Link to={`/users/${username}/todos`} className="btn-secondary">
            View Todos
          </Link>
        </div>
        <div className="stat-card">
          <h3>Posts</h3>
          <p className="stat-number">{posts.length}</p>
          <Link to={`/users/${username}/posts`} className="btn-secondary">
            View Posts
          </Link>
        </div>
        <div className="stat-card">
          <h3>Albums</h3>
          <p className="stat-number">{albums.length}</p>
          <Link to={`/users/${username}/albums`} className="btn-secondary">
            View Albums
          </Link>
        </div>
      </div>
    </div>
  );
}