

// frontend/src/components/ResumeUploader.jsx

import React, { useState } from 'react';

function ResumeUploader({ onUpload, isUploading }) {
    const [file, setFile] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (file) {
            onUpload(file);
            // setFile(null); // Optionally clear the input after upload
        }
    };

    return (
        <form onSubmit={handleSubmit} className="uploader-form">
            <label htmlFor="resume-file-input">
                Select a resume (.pdf, .docx):
            </label>
            <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                required
                disabled={isUploading}
            />
            <button type="submit" disabled={isUploading || !file}>
                {isUploading ? 'Uploading & Screening...' : 'Upload & Screen Resume'}
            </button>
            {isUploading && <p className="loading-message">Please wait while the AI screens the resume. This may take a moment...</p>}
        </form>
    );
}

export default ResumeUploader;
