import React, { useEffect, useState } from 'react';

interface InstagramPost {
    id: string;
    mediaUrl: string;
    permalink: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    thumbnailUrl?: string;
    caption?: string;
}

function InstagramFeed() {
    const [posts, setPosts] = useState<InstagramPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const response = await fetch(`https://feeds.behold.so/${import.meta.env.VITE_INSTAGRAM_FEED_ID}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch Instagram feed');
                }
                const data = await response.json();
                const feedItems = Array.isArray(data) ? data : (data.posts || []);
                setPosts(feedItems.slice(0, 6));
            } catch (err) {
                console.error('Error fetching Instagram feed:', err);
                setError('No se pudo cargar el feed de Instagram.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, []);

    if (loading) {
        return (
            <div className="instagram-loading">
                <div className="instagram-spinner"></div>
            </div>
        );
    }

    if (error || posts.length === 0) {
        return (
            <div className="instagram-grid-modern">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="instagram-post instagram-post-placeholder">
                        <span>@{i + 1}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="instagram-grid-modern">
            {posts.map((post, index) => (
                <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram-post"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <img
                        src={post.mediaType === 'VIDEO' ? post.thumbnailUrl || post.mediaUrl : post.mediaUrl}
                        alt={post.caption ? post.caption.slice(0, 100) : 'Instagram post'}
                        className="instagram-post-img"
                        loading="lazy"
                    />
                    <div className="instagram-post-overlay">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                    </div>
                </a>
            ))}
        </div>
    );
}

export default InstagramFeed;
