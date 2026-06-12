import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { albumsAPI, photosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

let cachedAlbums = null;

export default function AlbumsPage() {
  const { username } = useParams();
  const { user, updateStatCount } = useAuth();
  const [allAlbums, setAllAlbums] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
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
    if (cachedAlbums) {
      setAllAlbums(cachedAlbums);
      setInitialLoading(false);
      return;
    }
    if (!loadedRef.current) {
      fetchAllAlbums();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAllAlbums = async () => {
    setInitialLoading(true);
    setError('');
    try {
      const data = await albumsAPI.getAll(user.id, {});
      const sorted = data.sort((a, b) => a.id - b.id);
      setAllAlbums(sorted);
      cachedAlbums = sorted;
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

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumId) return null;
    return allAlbums.find((a) => a.id === selectedAlbumId) || null;
  }, [allAlbums, selectedAlbumId]);

  const handleSelectAlbum = async (albumId) => {
    setEditingId(null);
    setSelectedAlbumId(albumId);
    // Load photos for this album
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
        cachedAlbums = next;
        return next;
      });
      updateStatCount('album', 1);
      // Auto-select the newly created album
      setSelectedAlbumId(createdAlbum.id);
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
        cachedAlbums = next;
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
      if (selectedAlbumId === id) setSelectedAlbumId(null);
      setAllAlbums((prev) => {
        const next = prev.filter((a) => a.id !== id);
        cachedAlbums = next;
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

      {!initialLoading && (
        <div className="albums-layout">
          {/* Left sidebar - album list */}
          <div className="albums-sidebar">
            {displayedAlbums.length === 0 && <p className="empty-msg">No albums found.</p>}
            {displayedAlbums.map((album) => (
              <div
                key={album.id}
                className={`album-list-item ${selectedAlbumId === album.id ? 'selected' : ''}`}
                onClick={() => handleSelectAlbum(album.id)}
              >
                <span className="album-list-id">#{album.id}</span>
                <span className="album-list-title">{album.title}</span>
              </div>
            ))}
          </div>

          {/* Right panel - album details */}
          <div className="albums-main">
            {!selectedAlbum && (
              <div className="no-album-selected">
                Select an album from the list to view its content
              </div>
            )}

            {selectedAlbum && (
              <div className="album-detail-card">
                {editingId === selectedAlbum.id ? (
                  <div className="album-edit-section">
                    <h2>Edit Album</h2>
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button className="btn-save" onClick={() => handleUpdate(selectedAlbum.id)}>Save</button>
                        <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="album-detail-header">
                      <h2>{selectedAlbum.title}</h2>
                      <span className="album-detail-id">Album #{selectedAlbum.id}</span>
                    </div>
                    <div className="post-detail-actions">
                      <button
                        className="btn-edit"
                        onClick={() => { setEditingId(selectedAlbum.id); setEditTitle(selectedAlbum.title); }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(selectedAlbum.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}

                {/* Photos section */}
                <div className="photos-section">
                  {photosLoading[selectedAlbum.id] && <div className="loading">Loading photos...</div>}
                  {photos[selectedAlbum.id] && (
                    <>
                      <h3>Photos ({photos[selectedAlbum.id].length})</h3>
                      {photos[selectedAlbum.id].length === 0 && <p className="empty-msg">No photos yet.</p>}
                      <div className="photo-grid">
                        {photos[selectedAlbum.id].map((photo) => (
                          <div key={photo.id} className="photo-card">
                            <img src={photo.thumbnail_url || photo.url} alt={photo.title} />
                            <p>{photo.title}</p>
                            <button
                              className="btn-delete small"
                              onClick={() => handleDeletePhoto(photo.id, selectedAlbum.id)}
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
                        <button className="btn-primary" onClick={() => handleAddPhoto(selectedAlbum.id)}>
                          Add Photo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}