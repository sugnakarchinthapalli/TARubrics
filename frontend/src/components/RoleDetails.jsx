// frontend/src/components/RoleDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRoleDetails, getRoleResults, uploadResume } from '../api';
import ResultsTable from './ResultsTable';
import ResumeUploader from './ResumeUploader';

function RoleDetails() {
    const { id } = useParams(); // Get role ID from URL
    const [role, setRole] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Function to fetch all data for the role details page
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const roleData = await getRoleDetails(id);
            setRole(roleData);
            const resultsData = await getRoleResults(id);
            setResults(resultsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]); // Re-fetch data if role ID changes

    const handleResumeUpload = async (file) => {
        setIsUploading(true);
        setError(null);
        try {
            await uploadResume(id, file);
            alert('Resume uploaded and screened successfully!'); // Use alert for simplicity
            // Refresh results after successful upload
            await fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) return <div className="loading-message">Loading role details...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;
    if (!role) return <div className="no-data-message">Role not found.</div>;

    return (
        <div className="page-container role-details-container">
            <div className="role-info-section">
                <h2>Role: {role.title}</h2>
                <div className="details-card">
                    <h3>Job Description</h3>
                    <pre className="pre-formatted">{role.description}</pre>
                </div>
                <div className="details-card">
                    <h3>Evaluation Rubric</h3>
                    {role.rubric_text ? (
                        <pre className="pre-formatted">{role.rubric_text}</pre>
                    ) : (
                        <p className="no-data-message">No rubric available for this role. It might still be generating or an error occurred during creation.</p>
                    )}
                </div>
            </div>

            <div className="resume-management-section">
                <h3>Screen Resumes for This Role</h3>
                <ResumeUploader onUpload={handleResumeUpload} isUploading={isUploading} />
                <ResultsTable results={results} />
            </div>
        </div>
    );
}

export default RoleDetails;