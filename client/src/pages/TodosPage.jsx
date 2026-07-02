import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { todosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

window.appCache = window.appCache || {};
window.appCache.todos = window.appCache.todos || {};

export default function TodosPage() {
  const { username } = useParams();
  const { user, updateStatCount } = useAuth();
  const [allTodos, setAllTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [search, setSearch] = useState('');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const userCache = window.appCache.todos[user.id];

    if (userCache) {
      setAllTodos(userCache);
      setInitialLoading(false);
      return;
    }

    fetchAllTodos();

  }, [user?.id]);

  const fetchAllTodos = async () => {
    setInitialLoading(true);
    setError('');
    try {
      const data = await todosAPI.getAll(user.id, {});
      const sorted = data.sort((a, b) => a.id - b.id);
      setAllTodos(sorted);
      window.appCache.todos[user.id] = sorted;
      loadedRef.current = true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load todos');
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const displayedTodos = useMemo(() => {
    let result = allTodos;

    if (filter === 'completed') {
      result = result.filter((t) => t.completed);
    } else if (filter === 'pending') {
      result = result.filter((t) => !t.completed);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    return result;
  }, [allTodos, filter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const createdTodo = await todosAPI.create({ userId: user.id, title: newTitle.trim(), completed: false });
      setNewTitle('');
      setAllTodos((prev) => {
        const next = [...prev, createdTodo].sort((a, b) => a.id - b.id);
        window.appCache.todos[user.id] = next;
        return next;
      });
      updateStatCount('todo', 1);
    } catch (err) {
      setError('Failed to create todo');
    }
  };

  const handleToggle = async (todo) => {
    try {
      const updatedTodo = await todosAPI.update(todo.id, {
        userId: user.id,
        title: todo.title,
        completed: !todo.completed,
      });
      setAllTodos((prev) => {
        const next = prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t));
        window.appCache.todos[user.id] = next;
        return next;
      });
      updateStatCount('todoCompleted', todo.completed ? -1 : 1);
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleUpdate = async (id) => {
    if (!editTitle.trim()) return;
    try {
      const todo = allTodos.find((t) => t.id === id);
      await todosAPI.update(id, {
        userId: user.id,
        title: editTitle.trim(),
        completed: todo.completed,
      });
      setAllTodos((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t));
        window.appCache.todos[user.id] = next;
        return next;
      });
      setEditingId(null);
      setEditTitle('');
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this todo?')) return;
    try {
      const todo = allTodos.find((t) => t.id === id);
      await todosAPI.delete(id, user.id);
      setAllTodos((prev) => {
        const next = prev.filter((t) => t.id !== id);
        window.appCache.todos[user.id] = next;
        return next;
      });
      updateStatCount('todo', -1);
      if (todo.completed) {
        updateStatCount('todoCompleted', -1);
      }
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

      <div className="todo-list-scroll">
        {error && <div className="error-msg">{error}</div>}
        {initialLoading && <div className="loading">Loading...</div>}

        {!initialLoading && displayedTodos.length === 0 && <p className="empty-msg">No todos found.</p>}

        {!initialLoading && (
          <ul className="item-list">
            {displayedTodos.map((todo) => (
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
        )}
      </div>
    </div>
  );
}