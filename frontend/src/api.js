
// frontend/src/api.js

// Determine the base URL for API calls.
// In development, it points to the local backend server (port 8000).
// In production (on Vercel), it uses a relative path, which Vercel's rewrites handle.
const BASE_URL = import.meta.env.PROD ? '/' : 'http://localhost:8000';

/**
 * Fetches a list of all saved job roles.
 * @returns {Promise<Array>} A promise that resolves to an array of role objects.
 */
export const getRoles = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/roles`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch roles');
        }
        return response.json();
    } catch (error) {
        console.error("Error in getRoles:", error);
        throw error;
    }
};

/**
 * Creates a new job role with its description and optionally generates a rubric.
 * @param {string} title - The title of the job role.
 * @param {string} description - The full job description text.
 * @param {string} [oldRubric] - Optional: An existing rubric template to guide AI generation.
 * @returns {Promise<Object>} A promise that resolves to the created role object.
 */
export const createRole = async (title, description, oldRubric) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (oldRubric) {
        formData.append('old_rubric', oldRubric);
    }

    try {
        const response = await fetch(`${BASE_URL}/api/roles`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create role');
        }
        return response.json();
    } catch (error) {
        console.error("Error in createRole:", error);
        throw error;
    }
};

/**
 * Fetches details for a specific job role.
 * @param {string} roleId - The ID of the role.
 * @returns {Promise<Object>} A promise that resolves to the role details object.
 */
export const getRoleDetails = async (roleId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/roles/${roleId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch role details');
        }
        return response.json();
    } catch (error) {
        console.error("Error in getRoleDetails:", error);
        throw error;
    }
};

/**
 * Fetches all screened resumes and their evaluation results for a specific role.
 * @param {string} roleId - The ID of the role.
 * @returns {Promise<Array>} A promise that resolves to an array of resume result objects.
 */
export const getRoleResults = async (roleId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/roles/${roleId}/results`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch role results');
        }
        return response.json();
    } catch (error) {
        console.error("Error in getRoleResults:", error);
        throw error;
    }
};

/**
 * Uploads a resume file for screening against a specific role.
 * @param {string} roleId - The ID of the role.
 * @param {File} file - The resume file to upload.
 * @returns {Promise<Object>} A promise that resolves to the uploaded resume's data.
 */
export const uploadResume = async (roleId, file) => {
    const formData = new FormData();
    formData.append('resume_file', file);

    try {
        const response = await fetch(`${BASE_URL}/api/roles/${roleId}/upload-resume`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to upload resume');
        }
        return response.json();
    } catch (error) {
        console.error("Error in uploadResume:", error);
        throw error;
    }
};

