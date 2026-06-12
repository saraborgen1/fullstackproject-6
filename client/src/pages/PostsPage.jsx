import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

window.appCache = window.appCache || {};
window.appCache.posts = window.appCache.posts || {};

export default function PostsPage() {
  const { username } = useParams();
  const { user, updateStatCount } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [search, setSearch] = useState('');
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  // Editing post in right panel
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  // Comment editing
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const userCache = window.appCache.posts[user.id];

    if (userCache) {
      setAllPosts(userCache);
      setInitialLoading(false);
      return;
    }

    fetchAllPosts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchAllPosts = async () => {
    setInitialLoading(true);
    setError('');
    try {
      const data = await postsAPI.getAllPosts({});
      const sorted = data.sort((a, b) => a.id - b.id);
      setAllPosts(sorted);
      window.appCache.posts[user.id] = sorted;
      loadedRef.current = true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setInitialLoading(false);
    }
  };

  const displayedPosts = useMemo(() => {
    let result = allPosts;

    if (!showAllPosts) {
      result = result.filter((p) => p.user_id === user.id);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allPosts, showAllPosts, search, user.id]);

  const selectedPost = useMemo(() => {
    if (!selectedPostId) return null;
    return allPosts.find((p) => p.id === selectedPostId) || null;
  }, [allPosts, selectedPostId]);

  const isOwnPost = (post) => post && post.user_id === user.id;

  const loadComments = async (postId) => {
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

  const handleSelectPost = (postId) => {
    setIsEditing(false);
    setEditingCommentId(null);
    setSelectedPostId(postId);
    loadComments(postId);
  };

  const handleOpenAddModal = () => {
    setNewTitle('');
    setNewBody('');
    setShowAddModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      const createdPost = await postsAPI.create({ userId: user.id, title: newTitle.trim(), body: newBody.trim() });
      setShowAddModal(false);
      setNewTitle('');
      setNewBody('');
      setAllPosts((prev) => {
        const next = [...prev, createdPost].sort((a, b) => a.id - b.id);
        window.appCache.posts[user.id] = next;
        return next;
      });
      setSelectedPostId(createdPost.id);
      updateStatCount('post', 1);
    } catch {
      setError('Failed to create post');
    }
  };

  const handleStartEdit = () => {
    if (!selectedPost) return;
    setIsEditing(true);
    setEditTitle(selectedPost.title);
    setEditBody(selectedPost.body);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editBody.trim() || !selectedPost) return;
    try {
      await postsAPI.update(selectedPost.id, { userId: user.id, title: editTitle.trim(), body: editBody.trim() });
      setAllPosts((prev) => {
        const next = prev.map((p) => (p.id === selectedPost.id ? { ...p, title: editTitle.trim(), body: editBody.trim() } : p));
        window.appCache.posts[user.id] = next;
        return next;
      });
      setIsEditing(false);
    } catch {
      setError('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!selectedPost || !window.confirm('Delete this post?')) return;
    try {
      await postsAPI.delete(selectedPost.id, user.id);
      setAllPosts((prev) => {
        const next = prev.filter((p) => p.id !== selectedPost.id);
        window.appCache.posts[user.id] = next;
        return next;
      });
      setSelectedPostId(null);
      updateStatCount('post', -1);
    } catch {
      setError('Failed to delete post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!newCommentText.trim()) return;
    try {
      const createdComment = await commentsAPI.create({
        postId,
        userId: user.id,
        name: user.name,
        email: user.email,
        body: newCommentText.trim(),
      });
      setNewCommentText('');
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), createdComment],
      }));
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
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].map((c) =>
          c.id === commentId ? { ...c, body: editCommentBody.trim() } : c
        ),
      }));
      setEditingCommentId(null);
    } catch {
      setError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId, user.id);
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((c) => c.id !== commentId),
      }));
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
        Posts
      </h1>

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
        <button
          className={`btn-secondary ${showAllPosts ? '' : 'btn-active'}`}
          onClick={() => { setShowAllPosts(false); setSelectedPostId(null); setIsEditing(false); }}
        >
          My Posts
        </button>
        <button
          className={`btn-secondary ${showAllPosts ? 'btn-active' : ''}`}
          onClick={() => { setShowAllPosts(true); setSelectedPostId(null); setIsEditing(false); }}
        >
          All Posts
        </button>
        <button className="btn-primary" onClick={handleOpenAddModal}>
          Add Post
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {initialLoading && <div className="loading">Loading...</div>}

      {!initialLoading && (
        <div className="posts-layout">
          {/* Left sidebar - post list */}
          <div className="posts-sidebar">
            {displayedPosts.length === 0 && <p className="empty-msg">No posts found.</p>}
            {displayedPosts.map((post) => (
              <div
                key={post.id}
                className={`post-list-item ${selectedPostId === post.id ? 'selected' : ''}`}
                onClick={() => handleSelectPost(post.id)}
              >
                <span className="post-list-id">#{post.id}</span>
                <span className="post-list-title">{post.title}</span>
                {showAllPosts && isOwnPost(post) && <span className="own-badge">(yours)</span>}
              </div>
            ))}
          </div>

          {/* Right panel - post details */}
          <div className="posts-main">
            {!selectedPost && (
              <div className="no-post-selected">
                Select a post from the list to view its details
              </div>
            )}

            {selectedPost && (
              <div className="post-detail-card">
                {isEditing ? (
                  <form onSubmit={handleUpdate}>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label>Body</label>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        required
                        rows={5}
                      />
                    </div>
                    <div className="post-detail-actions">
                      <button type="submit" className="btn-save">Save</button>
                      <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2>{selectedPost.title}</h2>
                    <div className="post-body">{selectedPost.body}</div>
                    {isOwnPost(selectedPost) && (
                      <div className="post-detail-actions">
                        <button className="btn-edit" onClick={handleStartEdit}>Edit</button>
                        <button className="btn-delete" onClick={handleDelete}>Delete</button>
                      </div>
                    )}

                    {/* Comments section */}
                    <div className="comments-section">
                      {commentsLoading[selectedPost.id] && <div className="loading">Loading comments...</div>}
                      {comments[selectedPost.id] && (
                        <>
                          <h3>Comments ({comments[selectedPost.id].length})</h3>
                          {comments[selectedPost.id].length === 0 && <p>No comments yet.</p>}
                          <ul className="comment-list">
                            {comments[selectedPost.id].map((c) => (
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
                                    <button className="btn-save" onClick={() => handleEditComment(c.id, selectedPost.id)}>Save</button>
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
                                          onClick={() => handleDeleteComment(c.id, selectedPost.id)}
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
                            <button className="btn-primary" onClick={() => handleAddComment(selectedPost.id)}>
                              Add Comment
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating modal for adding a new post */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Post</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="Post title..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  required
                  placeholder="Post body..."
                  rows={4}
                />
              </div>
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)} style={{ marginLeft: '0.5rem' }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}