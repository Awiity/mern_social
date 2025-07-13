import React, { ChangeEvent, useState } from 'react';
import { Button, Card, Form, Alert, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { timeSince } from '../Static/date.methods';
import useFetch from '../Hooks/useFetch';
import { useAuth } from '../Context/auth.context';
import { User, Edit3, Mail, Calendar, Shield, Upload, X } from 'lucide-react';
import '../styles/userprofile.css';
import { updateUser } from '../Network/user.api';
import { AxiosResponse } from 'axios';
import { Post } from '../Components/post';

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://opalsocialbe.vercel.app'
    : process.env.DEV_API_URL || 'http://localhost:4000';

interface UserProfile {
    _id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    avatar?: string;
}

interface UpdateUserData {
    username?: string;
    email?: string;
    password?: string;
    avatar?: File | null;
}

interface IPostData {
    title: string;
    body: string | null;
    user_id: { username: string; _id: string };
    file: string;
    createdAt: Date;
    _id?: string;
}

export function UserPage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState<UpdateUserData>({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const { data: posts, setData: setPosts, error: postError, isLoading: postsLoading } = useFetch<IPostData[]>(`${API_BASE_URL}/api/posts/user/${id}`);


    // Fetch user profile data
    const { data: userProfile, isLoading, error, reload } = useFetch<UserProfile>(
        `${API_BASE_URL}/api/users/${id}`
    );

    const isOwner = currentUser && userProfile && currentUser._id === userProfile._id;

    const handleEditClick = () => {
        if (userProfile) {
            setEditData({
                username: userProfile.username,
                email: userProfile.email,
                password: ''
            });
            setShowEditModal(true);
            setUpdateError(null);
            setUpdateSuccess(false);
            setAvatarPreview(null);
        }
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditData({});
        setUpdateError(null);
        setUpdateSuccess(false);
        setAvatarPreview(null);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEditData({ ...editData, avatar: file });

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const removeAvatar = () => {
        setEditData({ ...editData, avatar: null });
        setAvatarPreview(null);
        // Clear file input
        const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setIsUpdating(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            // Filter out empty values
            const formData = new FormData();

            if (editData.username && editData.username.trim() !== userProfile.username) {
                formData.append('username', editData.username.trim());
            }
            if (editData.email && editData.email.trim() !== userProfile.email) {
                formData.append('email', editData.email.trim());
            }
            if (editData.password && editData.password.length >= 8) {
                formData.append('password', editData.password);
            }
            if (editData.avatar) {
                formData.append('avatar', editData.avatar);
            }

            if (Array.from(formData.keys()).length === 0) {
                setUpdateError('No changes detected to update');
                return;
            }

            const response: AxiosResponse = await updateUser(userProfile._id, formData);

            if (!response.status || response.status !== 200) {
                const errorData = response.data || { message: 'Failed to update profile' };
                throw new Error(errorData.message || 'Failed to update profile');
            }

            setUpdateSuccess(true);
            reload(); // Reload the profile data

            // Close modal after 2 seconds
            setTimeout(() => {
                handleCloseModal();
            }, 2000);

        } catch (error) {
            console.error('Error updating profile:', error);
            setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <Spinner animation="border" variant="success" />
                    <p className="loading-text">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !userProfile) {
        return (
            <div className="container mt-5">
                <div className="error-container">
                    <Alert variant="danger" className="error-alert">
                        <h5>Profile Not Found</h5>
                        <p className="mb-0">{error?.message || 'The requested user profile could not be found.'}</p>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-wrapper">
                {/* Profile Header */}
                <div className="profile-hero">
                    <div className="profile-hero-content">
                        <div className="profile-avatar-section">
                            <div className="avatar-container">
                                <img
                                    src={userProfile.avatar || '/default-avatar.png'}
                                    alt="User Avatar"
                                    className="profile-avatar"
                                />
                                <div className="avatar-overlay">
                                    <div className={`status-indicator ${userProfile.role.toLowerCase()}`}></div>
                                </div>
                            </div>
                        </div>
                        <div className="profile-info-section">
                            <div className="profile-main-info">
                                <h1 className="profile-username">@{userProfile.username}</h1>
                                <p className="profile-email">{userProfile.email}</p>
                                <div className="profile-badges">
                                    <span className={`role-badge role-${userProfile.role.toLowerCase()}`}>
                                        <Shield size={14} />
                                        {userProfile.role}
                                    </span>
                                </div>
                            </div>
                            {isOwner && (
                                <div className="profile-actions">
                                    <Button
                                        variant="outline-success"
                                        onClick={handleEditClick}
                                        className="edit-profile-btn"
                                    >
                                        <Edit3 size={16} />
                                        Edit Profile
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <Card className="profile-details-card">
                    <Card.Body>
                        <h5 className="details-title">Profile Details</h5>
                        <Row className="profile-details-grid">
                            <Col md={6}>
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <User size={20} />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Username</div>
                                        <div className="detail-value">@{userProfile.username}</div>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <Mail size={20} />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Email Address</div>
                                        <div className="detail-value">{userProfile.email}</div>
                                    </div>
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <Shield size={20} />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Account Role</div>
                                        <div className="detail-value">
                                            <span className={`role-badge role-${userProfile.role.toLowerCase()}`}>
                                                {userProfile.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Member Since</div>
                                        <div className="detail-value">
                                            {timeSince(new Date(userProfile.createdAt))}
                                        </div>
                                    </div>
                                </div>
                            </Col>

                        </Row>
                    </Card.Body>
                </Card>
                {/* User Posts Section */}
                {postsLoading ? (
                    <div className="loading-container">
                        <Spinner animation="border" variant="success" />
                        <p className="loading-text">Loading posts...</p>
                    </div>
                ) : postError ? (
                    <Alert variant="danger" className="error-alert">
                        <h5>Error Loading Posts</h5>
                        <p className="mb-0">{postError.message || 'Failed to load user posts.'}</p>
                    </Alert>
                ) : (
                    <div className="user-posts-section">
                        {posts && posts.length > 0 ? (posts.map((post: IPostData) => <Post key={post._id} post={post} />)) : (
                            <Alert variant="info" className="no-posts-alert">
                                <h5>No Posts Found</h5>
                                <p className="mb-0">This user has not posted anything yet.</p>
                            </Alert>
                        )}
                    </div>
                )}


                {/* Edit Profile Modal */}
                <Modal show={showEditModal} onHide={handleCloseModal} className="edit-modal" centered>
                    <Modal.Header closeButton className="edit-modal-header">
                        <Modal.Title>
                            <Edit3 size={20} className="me-2" />
                            Edit Profile
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="edit-modal-body">
                        <Form onSubmit={handleUpdateSubmit}>
                            {/* Avatar Section */}
                            <div className="avatar-edit-section">
                                <div className="current-avatar-display">
                                    <img
                                        src={avatarPreview || userProfile.avatar || '/default-avatar.png'}
                                        alt="Profile Avatar"
                                        className="edit-avatar-preview"
                                    />
                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            className="remove-avatar-btn"
                                            onClick={removeAvatar}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="avatar-upload-controls">
                                    <Form.Label className="avatar-upload-btn">
                                        <Upload size={16} className="me-2" />
                                        Choose New Avatar
                                        <Form.Control
                                            id="avatar-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            hidden
                                            disabled={isUpdating}
                                        />
                                    </Form.Label>
                                    <small className="avatar-help-text">
                                        JPG, PNG or GIF. Max size: 5MB
                                    </small>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="edit-form-label">
                                            <User size={16} className="me-2" />
                                            Username
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editData.username || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                                            className="edit-form-input"
                                            disabled={isUpdating}
                                            placeholder="Enter username"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="edit-form-label">
                                            <Mail size={16} className="me-2" />
                                            Email Address
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={editData.email || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                            className="edit-form-input"
                                            disabled={isUpdating}
                                            placeholder="Enter email address"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label className="edit-form-label">
                                    New Password (optional)
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    value={editData.password || ''}
                                    onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))}
                                    className="edit-form-input"
                                    placeholder="Enter new password (min. 8 characters)"
                                    disabled={isUpdating}
                                />
                                <small className="password-help-text">
                                    Leave empty to keep your current password
                                </small>
                            </Form.Group>

                            {/* Alerts */}
                            {updateError && (
                                <Alert variant="danger" className="form-alert">
                                    <strong>Error:</strong> {updateError}
                                </Alert>
                            )}
                            {updateSuccess && (
                                <Alert variant="success" className="form-alert">
                                    <strong>Success:</strong> Profile updated successfully!
                                </Alert>
                            )}

                            {/* Modal Actions */}
                            <div className="modal-actions">
                                <Button
                                    variant="secondary"
                                    onClick={handleCloseModal}
                                    disabled={isUpdating}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="success"
                                    disabled={isUpdating}
                                    className="update-btn"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-2"
                                            />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 size={16} className="me-2" />
                                            Update Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            </div>
        </div >
    );
}