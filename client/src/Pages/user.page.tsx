import React, { useState } from 'react';
import { Button, Card, Form, Alert, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { timeSince } from '../Static/date.methods';
import useFetch from '../Hooks/useFetch';
import { useAuth } from '../Context/auth.context';
import { User, Edit3, Mail, Calendar, Shield } from 'lucide-react';
import '../styles/userprofile.css';
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
}

interface UpdateUserData {
    username?: string;
    email?: string;
    password?: string;
}

export function UserPage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState<UpdateUserData>({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

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
        }
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditData({});
        setUpdateError(null);
        setUpdateSuccess(false);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setIsUpdating(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            // Filter out empty values
            const updatePayload: UpdateUserData = {};
            if (editData.username?.trim() && editData.username !== userProfile.username) {
                updatePayload.username = editData.username.trim();
            }
            if (editData.email?.trim() && editData.email !== userProfile.email) {
                updatePayload.email = editData.email.trim();
            }
            if (editData.password?.trim()) {
                updatePayload.password = editData.password.trim();
            }

            if (Object.keys(updatePayload).length === 0) {
                setUpdateError('No changes to update');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            setUpdateSuccess(true);
            reload(); // Reload the profile data

            // Close modal after 1.5 seconds
            setTimeout(() => {
                handleCloseModal();
            }, 1500);

        } catch (error) {
            console.error('Error updating profile:', error);
            setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" variant="success" />
            </div>
        );
    }

    if (error || !userProfile) {
        return (
            <div className="container mt-5">
                <Alert variant="danger">
                    {error?.message || 'User not found'}
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    {/* Profile Card */}
                    <Card className="profile-card mb-4">
                        <Card.Header className="profile-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="profile-title">
                                    <h4 className="mb-0">User Profile</h4>
                                </div>
                                {isOwner && (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={handleEditClick}
                                        className="edit-profile-btn"
                                    >
                                        <Edit3 size={16} className="me-2" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body className="profile-body">
                            <Row>
                                <Col md={6}>
                                    <div className="profile-field">
                                        <div className="field-label">
                                            <User size={16} className="me-2" />
                                            Username
                                        </div>
                                        <div className="field-value">
                                            @{userProfile.username}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="profile-field">
                                        <div className="field-label">
                                            <Mail size={16} className="me-2" />
                                            Email
                                        </div>
                                        <div className="field-value">
                                            {userProfile.email}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row className="mt-3">
                                <Col md={6}>
                                    <div className="profile-field">
                                        <div className="field-label">
                                            <Shield size={16} className="me-2" />
                                            Role
                                        </div>
                                        <div className="field-value">
                                            <span className={`role-badge role-${userProfile.role.toLowerCase()}`}>
                                                {userProfile.role}
                                            </span>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="profile-field">
                                        <div className="field-label">
                                            <Calendar size={16} className="me-2" />
                                            Member Since
                                        </div>
                                        <div className="field-value">
                                            {timeSince(new Date(userProfile.createdAt))}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            {userProfile.updatedAt !== userProfile.createdAt && (
                                <Row className="mt-3">
                                    <Col md={6}>
                                        <div className="profile-field">
                                            <div className="field-label">
                                                Last Updated
                                            </div>
                                            <div className="field-value">
                                                {timeSince(new Date(userProfile.updatedAt))}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Edit Profile Modal */}
                    <Modal show={showEditModal} onHide={handleCloseModal} className="edit-modal">
                        <Modal.Header closeButton className="edit-modal-header">
                            <Modal.Title>Edit Profile</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="edit-modal-body">
                            <Form onSubmit={handleUpdateSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="edit-form-label">Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editData.username || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                                        className="edit-form-input"
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label className="edit-form-label">Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={editData.email || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                        className="edit-form-input"
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label className="edit-form-label">New Password (optional)</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={editData.password || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))}
                                        className="edit-form-input"
                                        placeholder="Leave empty to keep current password"
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                                {updateError && (
                                    <Alert variant="danger" className="mb-3">
                                        {updateError}
                                    </Alert>
                                )}
                                {updateSuccess && (
                                    <Alert variant="success" className="mb-3">
                                        Profile updated successfully!
                                    </Alert>
                                )}
                                <div className="d-flex justify-content-end gap-2">
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
                                            'Update Profile'
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Modal.Body>
                    </Modal>
                </div>
            </div>
        </div>
    );
}