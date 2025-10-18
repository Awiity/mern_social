import React, { useState, useCallback, useMemo } from "react";
import { Alert, Button, Col, Container, Row, Spinner, Form, Badge } from "react-bootstrap";
import { Search, Plus, Filter, TrendingUp, Clock, Users } from "lucide-react";
import useFetch from "../Hooks/useFetch";
import AddPostModal from "../Components/add.post.modal";
import { Post } from "../Components/post";
import '../styles/news.css';
import { useAuth } from "../Context/auth.context";

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://mern-social-two-gamma.vercel.app'
    : process.env.DEV_API_URL || 'http://localhost:4000';

interface IPostData {
    title: string;
    body: string | null;
    user_id: { username: string; _id: string };
    file: string;
    createdAt: Date;
    _id?: string;
}

type SortOption = 'newest' | 'oldest' | 'popular';
type FilterOption = 'all' | 'with-images' | 'text-only';

export function NewsPage() {
    const { data, setData, error, isLoading } = useFetch(`${API_BASE_URL}/api/posts`);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [showFilters, setShowFilters] = useState<boolean>(false);

    const { isAuthenticated } = useAuth(); // Assuming you have a useAuth hook for authentication

    // Memoized filtered and sorted posts
    const filteredAndSortedPosts = useMemo(() => {
        if (!Array.isArray(data)) return [];

        let posts = [...data];

        // Apply search filter
        if (searchTerm.trim()) {
            posts = posts.filter(post =>
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.user_id.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply content filter
        switch (filterBy) {
            case 'with-images':
                posts = posts.filter(post => post.file);
                break;
            case 'text-only':
                posts = posts.filter(post => !post.file);
                break;
            default:
                break;
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'popular':
                // For now, sort by newest as popularity would require additional data
                posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            default:
                break;
        }

        return posts;
    }, [data, searchTerm, sortBy, filterBy]);

    // Memoized statistics
    const statistics = useMemo(() => {
        if (!Array.isArray(data)) return { total: 0, withImages: 0, textOnly: 0 };

        return {
            total: data.length,
            withImages: data.filter(post => post.file).length,
            textOnly: data.filter(post => !post.file).length
        };
    }, [data]);

    // Callback handlers
    const handleModalClose = useCallback(() => setShowModal(false), []);
    const handleModalOpen = useCallback(() => setShowModal(true), []);
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);
    const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as SortOption);
    }, []);
    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterBy(e.target.value as FilterOption);
    }, []);
    const toggleFilters = useCallback(() => setShowFilters(prev => !prev), []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setSortBy('newest');
        setFilterBy('all');
        setShowFilters(false);
    }, []);

    const renderHeader = () => (
        <div className="news-header-section">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <div className="header-title-section mb-3 mb-md-0">
                    <h1 className="news-title mb-2">
                        <TrendingUp className="me-2" size={32} />
                        Latest Gems
                    </h1>
                    <div className="d-flex flex-wrap gap-2">
                        <Badge bg="secondary" className="stats-badge">
                            <Users size={14} className="me-1" />
                            {statistics.total} gems
                        </Badge>
                        <Badge bg="info" className="stats-badge">
                            <Clock size={14} className="me-1" />
                            {statistics.withImages} with images
                        </Badge>
                    </div>
                </div>

                <Button
                    className="create-post-btn"
                    size="lg"
                    onClick={handleModalOpen}
                    aria-label="Create new gem"
                    disabled={!isAuthenticated}
                    title={isAuthenticated ? "Create a new gem" : "Please log in to create a gem"}
                >
                    <Plus size={20} className="me-2" />
                    Create a Gem
                </Button>
            </div>

            {/* Search and Filter Controls */}
            <div className="controls-section">
                <Row className="g-3 align-items-center">
                    <Col xs={12} md={6}>
                        <div className="search-container">
                            <Search size={20} className="search-icon" />
                            <Form.Control
                                type="text"
                                placeholder="Search gems, users, or content..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="search-input"
                                aria-label="Search gems"
                            />
                        </div>
                    </Col>
                    <Col xs={12} md={6}>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={toggleFilters}
                                className="filter-toggle-btn"
                                aria-expanded={showFilters}
                                aria-controls="filter-controls"
                            >
                                <Filter size={16} className="me-1" />
                                Filters
                            </Button>
                            {(searchTerm || sortBy !== 'newest' || filterBy !== 'all') && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="clear-filters-btn"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* Collapsible Filter Controls */}
                {showFilters && (
                    <div id="filter-controls" className="filter-controls mt-3 p-3 border rounded">
                        <Row className="g-3">
                            <Col xs={12} sm={6}>
                                <Form.Group>
                                    <Form.Label className="filter-label">Sort by</Form.Label>
                                    <Form.Select
                                        value={sortBy}
                                        onChange={handleSortChange}
                                        className="filter-select"
                                        aria-label="Sort gems"
                                    >
                                        <option value="newest">Newest first</option>
                                        <option value="oldest">Oldest first</option>
                                        <option value="popular">Most popular</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Form.Group>
                                    <Form.Label className="filter-label">Filter by content</Form.Label>
                                    <Form.Select
                                        value={filterBy}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                        aria-label="Filter gems by content type"
                                    >
                                        <option value="all">All gems</option>
                                        <option value="with-images">With images</option>
                                        <option value="text-only">Text only</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                )}
            </div>
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="loading-container">
                    <Spinner animation="border" variant="success" className="mb-3" />
                    <p className="loading-text">Loading gems...</p>
                </div>
            );
        }

        if (error instanceof Error) {
            return (
                <Alert variant="danger" className="error-alert">
                    <Alert.Heading>Error Loading Gems</Alert.Heading>
                    <p>{error.message}</p>
                </Alert>
            );
        }

        if (!Array.isArray(data) || data.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No gems yet</h3>
                    <p>Be the first to share something with the community!</p>
                    <Button
                        variant="success"
                        onClick={handleModalOpen}
                        className="mt-3"
                        disabled={!isAuthenticated}
                        title={isAuthenticated ? "Create a new gem" : "Please log in to create a gem"}>
                        <Plus size={20} className="me-2" />
                        Create First Gem
                    </Button>
                </div>
            );
        }

        if (filteredAndSortedPosts.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No gems match your criteria</h3>
                    <p>Try adjusting your search terms or filters.</p>
                    <Button variant="outline-secondary" onClick={clearFilters} className="mt-3">
                        Clear Filters
                    </Button>
                </div>
            );
        }

        return (
            <div className="posts-container">
                {filteredAndSortedPosts.map((post: IPostData) => (
                    <Post key={post._id} post={post} />
                ))}
            </div>
        );
    };

    const renderFooter = () => (
        <footer className="news-footer">
            <Container>
                <Row className="align-items-center">
                    <Col md={8} className="text-center text-md-start">
                        <p className="footer-text mb-2">
                            <span className="creator-name">Created by Ruslan Kildibekov</span>
                        </p>
                        <p className="footer-description">
                            Built with React, TypeScript, React-Bootstrap, and Tailwind CSS.
                            <span className="heart-icon">♥</span> Made with passion for web development.
                        </p>
                    </Col>
                    <Col md={4} className="text-center text-md-end">
                        <div className="footer-stats">
                            <small className="text-muted">
                                Showing {filteredAndSortedPosts.length} of {statistics.total} gems
                            </small>
                        </div>
                    </Col>
                </Row>
            </Container>
        </footer>
    );

    return (
        <div className="news-page">
            <Container className="news-container">
                {renderHeader()}
                {renderContent()}
            </Container>
            {renderFooter()}
            <AddPostModal
                show={showModal}
                onClose={handleModalClose}
                posts={data}
                setPosts={setData}
            />
        </div>
    );
}