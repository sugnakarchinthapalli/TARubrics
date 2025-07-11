// frontend/src/components/RoleList.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRoles } from '../api';

function RoleList() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await getRoles();
                setRoles(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    if (loading) return <div className="loading-message">Loading roles...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="page-container">
            <h2>Saved Roles</h2>
            {roles.length === 0 ? (
                <p className="no-data-message">No roles saved yet. <Link to="/create-role">Create one now!</Link></p>
            ) : (
                <div className="role-list-grid">
                    {roles.map(role => (
                        <div key={role.id} className="role-card">
                            <h3>{role.title}</h3>
                            <p className="role-date">Created: {new Date(role.created_at).toLocaleDateString()}</p>
                            <Link to={`/role/${role.id}`} className="view-details-link">View Details & Screen Resumes</Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RoleList;