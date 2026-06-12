import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { todosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TodosPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, pending
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter, search]);

  const fetchTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter === 'completed') params.completed = true;
      if (filter === 'pending') params.completed = false;
      if (search.trim()) params.search = search.trim();
      const data = await todosAPI.getAll(user.id, params);
      setTodos(data.sort((a, b) => a.id - b.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await todosAPI.create({ userId: user.id, title: newTitle.trim(), completed: false });
      setNewTitle('');
      fetchTodos();
    } catch (err) {
      setError('Failed to create todo');
    }
  };

  const handleToggle = async (todo) => {
    try {
      await todosAPI.update(todo.id, {
        userId: user.id,
        title: todo.title,
        completed: !todo.completed,
      });
      fetchTodos();
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleUpdate = async (id) => {
    if (!editTitle.trim()) return;
    try {
      const todo = todos.find((t) => t.id === id);
      await todosAPI.update(id, {
        userId: user.id,
        title: editTitle.trim(),
        completed: todo.completed,
      });
      setEditingId(null);
      setEditTitle('');
      fetchTodos();
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this todo?')) return;
    try {
      await todosAPI.delete(id, user.id);
      fetchTodos();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  return (
    <div className="page-container">
      <h1>
        <Link to={`/users/${username}/dashboard`} className="back-link">
          ←
        </Link>{' '}
        Todos for {username}
      </h1>

      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New todo title..."
          required
        />
        <button type="submit" className="btn-primary">Add Todo</button>
      </form>

      <div className="filter-bar">
        <label>
          Filter:{' '}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </label>
        <label>
          Search:{' '}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search todos..."
          />
        </label>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      {!loading && todos.length === 0 && <p className="empty-msg">No todos found.</p>}

      <ul className="item-list">
        {todos.map((todo) => (
          <li key={todo.id} className={`item-card ${todo.completed ? 'completed' : ''}`}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
              />
            </label>
            <div className="item-content">
              {editingId === todo.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <button className="btn-save" onClick={() => handleUpdate(todo.id)}>Save</button>
                  <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <span
                  className={`todo-title ${todo.completed ? 'line-through' : ''}`}
                  onDoubleClick={() => startEdit(todo)}
                >
                  {todo.title}
                </span>
              )}
            </div>
            <div className="item-actions">
              {editingId !== todo.id && (
                <button className="btn-edit" onClick={() => startEdit(todo)}>Edit</button>
              )}
              <button className="btn-delete" onClick={() => handleDelete(todo.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}