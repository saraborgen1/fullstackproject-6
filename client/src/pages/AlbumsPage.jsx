import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { albumsAPI, photosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const cachedAlbumsByUser = {};
const PHOTOS_PER_PAGE = 6;

export default function AlbumsPage() {
  const { username } = useParams();
  const { user, updateStatCount } = useAuth();
  const [allAlbums, setAllAlbums] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [search, setSearch] = useState('');
  // Photo new
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const loadedRef = useRef(false);

  // Server-side pagination state per album
  const [albumPhotos, setAlbumPhotos] = useState({});       // { albumId: [photo, ...] }
  const [albumTotal, setAlbumTotal] = useState({});          // { albumId: totalCount }
  const [albumPage, setAlbumPage] = useState({});            // { albumId: currentPage (1-based) }
  const [albumLoading, setAlbumLoading] = useState({});      // { albumId: bool }
  const [albumLoadingMore, setAlbumLoadingMore] = useState({}); // { albumId: bool }

  // Lightbox state
  const [lightbox, setLightbox] = useState({ open: false, photoIndex: 0 });

  useEffect(() => {
    if (!user) return;

    const userCache = cachedAlbumsByUser[user.id];

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
      cachedAlbumsByUser[user.id] = sorted;
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

  // Current loaded photos and totals for the selected album
  const currentPhotos = selectedAlbumId ? (albumPhotos[selectedAlbumId] || []) : [];
  const currentTotal = selectedAlbumId ? (albumTotal[selectedAlbumId] || 0) : 0;
  const currentPage = selectedAlbumId ? (albumPage[selectedAlbumId] || 1) : 1;
  const hasMore = currentPhotos.length < currentTotal;
  const isLoadingMore = selectedAlbumId ? !!albumLoadingMore[selectedAlbumId] : false;

  // Fetch first page of photos for an album
  const handleSelectAlbum = useCallback(async (albumId) => {
    setEditingId(null);
    setSelectedAlbumId(albumId);

    // If we already have photos loaded for this album, don't re-fetch
    if (albumPhotos[albumId]) return;

    setAlbumLoading((prev) => ({ ...prev, [albumId]: true }));
    try {
      const data = await photosAPI.getPaginated(albumId, 1, PHOTOS_PER_PAGE);
      setAlbumPhotos((prev) => ({ ...prev, [albumId]: data.photos }));
      setAlbumTotal((prev) => ({ ...prev, [albumId]: data.total }));
      setAlbumPage((prev) => ({ ...prev, [albumId]: 1 }));
    } catch {
      setError('Failed to load photos');
    } finally {
      setAlbumLoading((prev) => ({ ...prev, [albumId]: false }));
    }
  }, [albumPhotos]);

  // Fetch next page from server
  const handleLoadMore = useCallback(async () => {
    if (!selectedAlbumId || !hasMore || isLoadingMore) return;
    const nextPage = currentPage + 1;

    setAlbumLoadingMore((prev) => ({ ...prev, [selectedAlbumId]: true }));
    try {
      const data = await photosAPI.getPaginated(selectedAlbumId, nextPage, PHOTOS_PER_PAGE);
      setAlbumPhotos((prev) => ({
        ...prev,
        [selectedAlbumId]: [...(prev[selectedAlbumId] || []), ...data.photos],
      }));
      setAlbumPage((prev) => ({ ...prev, [selectedAlbumId]: nextPage }));
    } catch {
      setError('Failed to load more photos');
    } finally {
      setAlbumLoadingMore((prev) => ({ ...prev, [selectedAlbumId]: false }));
    }
  }, [selectedAlbumId, currentPage, hasMore, isLoadingMore]);

  // Load all remaining photos from server
  const handleShowAll = useCallback(async () => {
    if (!selectedAlbumId || !hasMore || isLoadingMore) return;

    setAlbumLoadingMore((prev) => ({ ...prev, [selectedAlbumId]: true }));
    try {
      // Fetch all remaining pages
      const total = albumTotal[selectedAlbumId];
      const allLoaded = albumPhotos[selectedAlbumId] || [];
      const nextPage = currentPage + 1;
      const lastPage = Math.ceil(total / PHOTOS_PER_PAGE);

      const fetchPromises = [];
      for (let p = nextPage; p <= lastPage; p++) {
        fetchPromises.push(photosAPI.getPaginated(selectedAlbumId, p, PHOTOS_PER_PAGE));
      }
      const results = await Promise.all(fetchPromises);
      const allRemaining = results.flatMap((r) => r.photos);

      setAlbumPhotos((prev) => ({
        ...prev,
        [selectedAlbumId]: [...allLoaded, ...allRemaining],
      }));
      setAlbumPage((prev) => ({ ...prev, [selectedAlbumId]: lastPage }));
    } catch {
      setError('Failed to load all photos');
    } finally {
      setAlbumLoadingMore((prev) => ({ ...prev, [selectedAlbumId]: false }));
    }
  }, [selectedAlbumId, currentPage, hasMore, isLoadingMore, albumTotal, albumPhotos]);

  // Lightbox navigation
  const openLightbox = useCallback((index) => {
    setLightbox({ open: true, photoIndex: index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox({ open: false, photoIndex: 0 });
  }, []);

  const goToNext = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      photoIndex: Math.min(prev.photoIndex + 1, currentPhotos.length - 1),
    }));
  }, [currentPhotos.length]);

  const goToPrev = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      photoIndex: Math.max(prev.photoIndex - 1, 0),
    }));
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox.open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox.open, closeLightbox, goToNext, goToPrev]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const createdAlbum = await albumsAPI.create({ userId: user.id, title: newTitle.trim() });
      setNewTitle('');
      setAllAlbums((prev) => {
        const next = [...prev, createdAlbum].sort((a, b) => a.id - b.id);
        cachedAlbumsByUser[user.id] = next;
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
        cachedAlbumsByUser[user.id] = next;
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
        cachedAlbumsByUser[user.id] = next;
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
      // Add the new photo to the beginning of the current list
      setAlbumPhotos((prev) => ({
        ...prev,
        [albumId]: [createdPhoto, ...(prev[albumId] || [])],
      }));
      setAlbumTotal((prev) => ({ ...prev, [albumId]: (prev[albumId] || 0) + 1 }));
    } catch {
      setError('Failed to add photo');
    }
  };

  const handleDeletePhoto = async (photoId, albumId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await photosAPI.delete(photoId, albumId);
      setAlbumPhotos((prev) => ({
        ...prev,
        [albumId]: prev[albumId].filter((p) => p.id !== photoId),
      }));
      setAlbumTotal((prev) => ({ ...prev, [albumId]: Math.max(0, (prev[albumId] || 1) - 1) }));
    } catch {
      setError('Failed to delete photo');
    }
  };

  // Calculate progress percentage
  const progressPercent = currentTotal > 0 ? Math.min(100, Math.round((currentPhotos.length / currentTotal) * 100)) : 0;

  return (
    <div className="page-container">
      <h1>
        <Link to={`/users/${username}/dashboard`} className="back-link">
          ←
        </Link>{' '}
        Albums of {username}
      </h1>

      {/* Combined create + search form on same line */}
      <form onSubmit={handleCreate} className="create-form album-create-row">
        <div className="album-search-inline">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search albums..."
          />
        </div>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New album title..."
          required
        />
        <button type="submit" className="btn-primary">Add Album</button>
      </form>

      {error && <div className="error-msg">{error}</div>}
      {initialLoading && (
        <div className="loading-albums">
          <div className="loading-spinner"></div>
          <span>Loading albums...</span>
        </div>
      )}

      {!initialLoading && (
        <div className="albums-layout">
          {/* Left sidebar - album list */}
          <div className="albums-sidebar">
            {displayedAlbums.length === 0 && <p className="empty-msg">No albums found.</p>}
            {displayedAlbums.map((album, index) => (
              <div
                key={album.id}
                className={`album-list-item ${selectedAlbumId === album.id ? 'selected' : ''}`}
                onClick={() => handleSelectAlbum(album.id)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="album-list-id">#{album.id}</span>
                <span className="album-list-title">{album.title}</span>
                {albumTotal[album.id] !== undefined && (
                  <span className="album-photo-count">{albumTotal[album.id]} 📷</span>
                )}
              </div>
            ))}
          </div>

          {/* Right panel - album details */}
          <div className="albums-main">
            {!selectedAlbum && (
              <div className="no-album-selected">
                <div className="no-album-icon">📷</div>
                <p>Select an album from the list to view its content</p>
              </div>
            )}

            {selectedAlbum && (
              <div className="album-detail-card">
                {editingId === selectedAlbum.id ? (
                  <div className="album-edit-section">
                    <h2>✏️ Edit Album</h2>
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
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(selectedAlbum.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}

                {/* Photos section */}
                <div className="photos-section">
                  {albumLoading[selectedAlbum.id] && (
                    <div className="loading-photos">
                      <div className="loading-spinner"></div>
                      <span>Loading photos...</span>
                    </div>
                  )}

                  {!albumLoading[selectedAlbum.id] && albumPhotos[selectedAlbum.id] !== undefined && (
                    <>
                      <div className="photos-header">
                        <h3>📸 Photos ({currentTotal})</h3>
                        {currentTotal > 0 && (
                          <span className="photos-showing-label">
                            Showing {currentPhotos.length} of {currentTotal}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {currentTotal > PHOTOS_PER_PAGE && (
                        <div className="photos-progress-bar">
                          <div
                            className="photos-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      )}

                      {currentTotal === 0 && <p className="empty-msg">No photos yet. Add your first photo below!</p>}
                      <div className="photo-grid">
                        {currentPhotos.map((photo, index) => (
                          <div
                            key={photo.id}
                            className="photo-card"
                            style={{ animationDelay: `${(index % PHOTOS_PER_PAGE) * 0.08}s` }}
                            onClick={() => openLightbox(index)}
                          >
                            <div className="photo-card-image">
                              <img src={photo.thumbnail_url || photo.url} alt={photo.title} loading="lazy" />
                              <div className="photo-card-overlay">
                                <span className="photo-zoom-icon">🔍</span>
                              </div>
                            </div>
                            <p className="photo-card-title">{photo.title}</p>
                            <button
                              className="btn-delete small photo-delete-btn"
                              onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, selectedAlbum.id); }}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Load more controls */}
                      {currentTotal > PHOTOS_PER_PAGE && hasMore && (
                        <div className="photos-load-controls">
                          <button
                            className="btn-load-more"
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                          >
                            {isLoadingMore ? (
                              <><div className="loading-spinner small"></div> Loading...</>
                            ) : (
                              <>▼ Load More ({currentTotal - currentPhotos.length} remaining)</>
                            )}
                          </button>
                          {!isLoadingMore && (
                            <button className="btn-show-all" onClick={handleShowAll}>
                              Show All ({currentTotal})
                            </button>
                          )}
                        </div>
                      )}

                      {/* All loaded message */}
                      {currentTotal > PHOTOS_PER_PAGE && !hasMore && currentTotal > 0 && (
                        <div className="photos-all-loaded">
                          ✓ All {currentTotal} photos loaded
                        </div>
                      )}

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
                          📷 Add Photo
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

      {/* Lightbox */}
      {lightbox.open && currentPhotos.length > 0 && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
            
            <div className="lightbox-content">
              <button
                className="lightbox-nav lightbox-prev"
                onClick={goToPrev}
                disabled={lightbox.photoIndex === 0}
              >
                ‹
              </button>

              <div className="lightbox-image-wrapper">
                <img
                  src={currentPhotos[lightbox.photoIndex]?.url}
                  alt={currentPhotos[lightbox.photoIndex]?.title}
                  className="lightbox-image"
                />
                <div className="lightbox-info">
                  <span className="lightbox-title">{currentPhotos[lightbox.photoIndex]?.title}</span>
                  <span className="lightbox-counter">
                    {lightbox.photoIndex + 1} / {currentPhotos.length}
                  </span>
                </div>
              </div>

              <button
                className="lightbox-nav lightbox-next"
                onClick={goToNext}
                disabled={lightbox.photoIndex === currentPhotos.length - 1}
              >
                ›
              </button>
            </div>

            {/* Thumbnail strip */}
            <div className="lightbox-thumbnails">
              {currentPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`lightbox-thumb ${index === lightbox.photoIndex ? 'active' : ''}`}
                  onClick={() => setLightbox((prev) => ({ ...prev, photoIndex: index }))}
                >
                  <img src={photo.thumbnail_url || photo.url} alt={photo.title} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}