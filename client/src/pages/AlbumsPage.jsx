import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { albumsAPI, photosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

window.appCache = window.appCache || {};
window.appCache.albums = window.appCache.albums || {};

export default function AlbumsPage() {
  const { username } = useParams();
  const { user, updateStatCount } = useAuth();
  const [allAlbums, setAllAlbums] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [photos, setPhotos] = useState({});
  const [photosLoading, setPhotosLoading] = useState({});
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [search, setSearch] = useState('');
  // Photo new
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const userCache = window.appCache.albums[user.id];

    if (userCache) {
      setAllAlbums(userCache);
      setInitialLoading(false);
      return;
    }

    fetchAllAlbums();

  }, [user?.id]);

  const fetchAllAlbums = async () => {
    setInitialLoading(true);
    setError('');
    try {
      const data = await albumsAPI.getAll(user.id, {});
      const sorted = data.sort((a, b) => a.id - b.id);
      setAllAlbums(sorted);
      window.appCache.albums[user.id] = sorted;
      loadedRef.current = true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load albums');
    } finally {
      setInitialLoading(false);
    }
  };

  const displayedAlbums = useMemo(() => {
    let result = allAlbums;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    return result;
  }, [allAlbums, search]);

  const togglePhotos = async (albumId) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null);
      return;
    }
    setExpandedAlbum(albumId);
    if (!photos[albumId]) {
      setPhotosLoading((prev) => ({ ...prev, [albumId]: true }));
      try {
        const data = await photosAPI.getAll(albumId);
        setPhotos((prev) => ({ ...prev, [albumId]: data }));
      } catch {
        setError('Failed to load photos');
      } finally {
        setPhotosLoading((prev) => ({ ...prev, [albumId]: false }));
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const createdAlbum = await albumsAPI.create({ userId: user.id, title: newTitle.trim() });
      setNewTitle('');
      setAllAlbums((prev) => {
        const next = [...prev, createdAlbum].sort((a, b) => a.id - b.id);
        window.appCache.albums[user.id] = next;
        return next;
      });
      updateStatCount('album', 1);
    } catch {
      setError('Failed to create album');
    }
  };

  const handleUpdate = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await albumsAPI.update(id, { userId: user.id, title: editTitle.trim() });
      setAllAlbums((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, title: editTitle.trim() } : a));
        window.appCache.albums[user.id] = next;
        return next;
      });
      setEditingId(null);
    } catch {
      setError('Failed to update album');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this album?')) return;
    try {
      await albumsAPI.delete(id, user.id);
      if (expandedAlbum === id) setExpandedAlbum(null);
      setAllAlbums((prev) => {
        const next = prev.filter((a) => a.id !== id);
        window.appCache.albums[user.id] = next;
        return next;
      });
      updateStatCount('album', -1);
    } catch {
      setError('Failed to delete album');
    }
  };

  const handleAddPhoto = async (albumId) => {
    if (!newPhotoTitle.trim() || !newPhotoUrl.trim()) return;
    try {
      const createdPhoto = await photosAPI.create({
        albumId,
        title: newPhotoTitle.trim(),
        url: newPhotoUrl.trim(),
        thumbnailUrl: newPhotoUrl.trim(),
      });
      setNewPhotoTitle('');
      setNewPhotoUrl('');
      setPhotos((prev) => ({
        ...prev,
        [albumId]: [...(prev[albumId] || []), createdPhoto],
      }));
    } catch {
      setError('Failed to add photo');
    }
  };

  const handleDeletePhoto = async (photoId, albumId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await photosAPI.delete(photoId, albumId);
      setPhotos((prev) => ({
        ...prev,
        [albumId]: prev[albumId].filter((p) => p.id !== photoId),
      }));
    } catch {
      setError('Failed to delete photo');
    }
  };

  return (
    <div className="page-container">
      <h1>
        <Link to={`/users/${username}/dashboard`} className="back-link">
          ←
        </Link>{' '}
        Albums of {username}
      </h1>

      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New album title..."
          required
        />
        <button type="submit" className="btn-primary">Add Album</button>
      </form>

      <div className="filter-bar">
        <label>
          Search:{' '}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search albums..."
          />
        </label>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {initialLoading && <div className="loading">Loading...</div>}
      {!initialLoading && displayedAlbums.length === 0 && <p className="empty-msg">No albums found.</p>}

      {!initialLoading && (
        <ul className="item-list">
          {displayedAlbums.map((album) => (
            <li key={album.id} className="item-card album-card">
              {editingId === album.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <button className="btn-save" onClick={() => handleUpdate(album.id)}>Save</button>
                  <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="album-content">
                    <h3>{album.title}</h3>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => { setEditingId(album.id); setEditTitle(album.title); }}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(album.id)}>Delete</button>
                    <button className="btn-secondary" onClick={() => togglePhotos(album.id)}>
                      {expandedAlbum === album.id ? 'Hide Photos' : 'Photos'}
                    </button>
                  </div>
                </>
              )}

              {expandedAlbum === album.id && (
                <div className="photos-section">
                  {photosLoading[album.id] && <div className="loading">Loading photos...</div>}
                  {photos[album.id] && (
                    <>
                      {photos[album.id].length === 0 && <p>No photos yet.</p>}
                      <div className="photo-grid">
                        {photos[album.id].map((photo) => (
                          <div key={photo.id} className="photo-card">
                            <img src={photo.thumbnail_url || photo.url} alt={photo.title} />
                            <p>{photo.title}</p>
                            <button
                              className="btn-delete small"
                              onClick={() => handleDeletePhoto(photo.id, album.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="add-photo-form">
                        <input
                          type="text"
                          value={newPhotoTitle}
                          onChange={(e) => setNewPhotoTitle(e.target.value)}
                          placeholder="Photo title..."
                        />
                        <input
                          type="text"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="Photo URL..."
                        />
                        <button className="btn-primary" onClick={() => handleAddPhoto(album.id)}>
                          Add Photo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}