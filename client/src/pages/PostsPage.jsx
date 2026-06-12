import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PostsPage() {
  const { username } = useParams();
  const { user, updateStatCount } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [search, setSearch] = useState('');
  // Comment editing
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (user) fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const data = await postsAPI.getAll(user.id, params);
      setPosts(data.sort((a, b) => a.id - b.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!comments[postId]) {
      setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
      try {
        const data = await commentsAPI.getAll(postId);
        setComments((prev) => ({ ...prev, [postId]: data }));
      } catch {
        setError('Failed to load comments');
      } finally {
        setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      await postsAPI.create({ userId: user.id, title: newTitle.trim(), body: newBody.trim() });
      setNewTitle('');
      setNewBody('');
      updateStatCount('post', 1);
      fetchPosts();
    } catch {
      setError('Failed to create post');
    }
  };

  const handleEdit = (post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  };

  const handleUpdate = async (id) => {
    if (!editTitle.trim() || !editBody.trim()) return;
    try {
      await postsAPI.update(id, { userId: user.id, title: editTitle.trim(), body: editBody.trim() });
      setEditingId(null);
      fetchPosts();
    } catch {
      setError('Failed to update post');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postsAPI.delete(id, user.id);
      if (expandedPost === id) setExpandedPost(null);
      updateStatCount('post', -1);
      fetchPosts();
    } catch {
      setError('Failed to delete post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!newCommentText.trim()) return;
    try {
      await commentsAPI.create({
        postId,
        userId: user.id,
        name: user.name,
        email: user.email,
        body: newCommentText.trim(),
      });
      setNewCommentText('');
      const data = await commentsAPI.getAll(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch {
      setError('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId, postId) => {
    if (!editCommentBody.trim()) return;
    try {
      await commentsAPI.update(commentId, {
        userId: user.id,
        name: user.name,
        email: user.email,
        body: editCommentBody.trim(),
      });
      setEditingCommentId(null);
      const data = await commentsAPI.getAll(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch {
      setError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId, user.id);
      const data = await commentsAPI.getAll(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch {
      setError('Failed to delete comment');
    }
  };

  return (
    <div className="page-container">
      <h1>
        <Link to={`/users/${username}/dashboard`} className="back-link">
          ←
        </Link>{' '}
        Posts by {username}
      </h1>

      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Post title..."
          required
        />
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Post body..."
          required
          rows={3}
        />
        <button type="submit" className="btn-primary">Add Post</button>
      </form>

      <div className="filter-bar">
        <label>
          Search:{' '}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
          />
        </label>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Loading...</div>}
      {!loading && posts.length === 0 && <p className="empty-msg">No posts found.</p>}

      <ul className="item-list">
        {posts.map((post) => (
          <li key={post.id} className="item-card post-card">
            {editingId === post.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} />
                <div className="edit-actions">
                  <button className="btn-save" onClick={() => handleUpdate(post.id)}>Save</button>
                  <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="post-content">
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                </div>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleEdit(post)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(post.id)}>Delete</button>
                  <button
                    className="btn-secondary"
                    onClick={() => toggleComments(post.id)}
                  >
                    {expandedPost === post.id ? 'Hide Comments' : 'Comments'}
                  </button>
                </div>
              </>
            )}

            {expandedPost === post.id && (
              <div className="comments-section">
                {commentsLoading[post.id] && <div className="loading">Loading comments...</div>}
                {comments[post.id] && (
                  <>
                    {comments[post.id].length === 0 && <p>No comments yet.</p>}
                    <ul className="comment-list">
                      {comments[post.id].map((c) => (
                        <li key={c.id} className="comment-item">
                          <strong>{c.name}</strong> ({c.email})
                          {editingCommentId === c.id ? (
                            <div className="edit-form inline">
                              <textarea
                                value={editCommentBody}
                                onChange={(e) => setEditCommentBody(e.target.value)}
                                rows={2}
                                autoFocus
                              />
                              <button className="btn-save" onClick={() => handleEditComment(c.id, post.id)}>Save</button>
                              <button className="btn-cancel" onClick={() => setEditingCommentId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <p>{c.body}</p>
                              {c.user_id === user.id && (
                                <div className="item-actions small">
                                  <button
                                    className="btn-edit"
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentBody(c.body);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteComment(c.id, post.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="add-comment-form">
                      <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                      />
                      <button className="btn-primary" onClick={() => handleAddComment(post.id)}>
                        Add Comment
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}