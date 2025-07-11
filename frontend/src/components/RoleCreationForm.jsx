// frontend/src/components/RoleCreationForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRole } from '../api';

// This template will be sent to the AI to guide the new rubric generation
const oldRubricTemplate = `
Competency 1: Strategic Growth & Client Alignment (Weight: 25%)
4 (Exceeds):
 Proactively identifies and implements significant program growth, service expansion, and process improvements. Consistently leads impactful business reviews with insightful strategic recommendations. Builds exceptionally strong, trust-based client relationships at senior levels.

3 (Meets):
 Develops and executes strategic initiatives effectively. Builds and maintains solid client relationships with proactive communication. Leads business reviews capably, providing performance insights. Identifies opportunities for program growth.

2 (Approaches):
 Shows understanding but limited experience in independent development/execution. Client communication experience, but may lack proactive strategic relationship building. Participated in, not led, business reviews.

1 (Below):
 Limited/no experience in strategic initiatives, senior client relationships, or leading business reviews.

Competency 2: Ad Operations, Account Onboarding & Management (Weight: 20%)
4 (Exceeds):
 2+ yrs & deep expertise in Ad Ops, seamless onboarding, significantly improving activation/retention. Drives growth/upsell, develops highly scalable onboarding. Expert in digital ad platforms.

3 (Meets):
 2+ yrs in Ad Ops & Acc Mgt. Effective onboarding, tracks metrics, works with AMs for growth, refined onboarding processes. Proficient with digital ad platforms.

2 (Approaches):
 Some Ad Ops/Acc Mgt experience, may not meet 2+ yrs. Understands onboarding, limited optimization experience. Familiar with some platforms.

1 (Below):
 Minimal experience in Ad Ops, onboarding, or account mgt. Little/no platform experience.

Competency 3: Customer Success Management & Support Excellence (Weight: 20%)
4 (Exceeds):
 7+ yrs leading CS, exceeds CSAT via proactive strategies & innovative self-service. Expertly monitors lifecycle, resolves complex pain points. Drives cross-functional improvements. Deep expertise with CS platforms.

3 (Meets):
 7+ yrs in CS. Monitors metrics, identifies pain points. Oversees support effectively, maintains good CSAT. Contributes to self-service. Proficient with CS strategies/platforms.

2 (Approaches):
 Some CS/support experience, may not meet 7+ yrs/strategic depth. Understands CSAT/support ops, limited proactive strategy/self-service. Used CS platforms, not strategic implementation.

1 (Below):
 Little/no strategic CS experience or overseeing support.

Competency 4: Leadership & People Management (Weight: 20%)
4 (Exceeds):
 4+ yrs leading/inspiring large, cross-functional teams to high performance. Fosters strong culture (collaboration, innovation, accountability). Established comprehensive career dev paths, coaching, training with measurable growth.

3 (Meets):
 2+ yrs managing cross-functional teams. Fosters positive culture. Implements coaching/training. Ensures team alignment.

2 (Approaches):
 Team lead/supervisory experience, may not meet 2+ yrs/cross-functional. Understands mentorship/development, limited strategic application.

1 (Below):
 No significant team management experience.

Competency 5: Process Improvement, Automation & Reporting (Weight: 15%)
4 (Exceeds):
 Proven track record of significant automation & process improvements enhancing efficiency/scalability (onboarding, self-service). Expert in data/reporting tools for insights & workflow optimization. Ensures highly accurate, insightful real-time reporting.

3 (Meets):
 Experience developing scalable processes, optimizing support models. Ensures accurate reporting, works with data analysts. Drove some automation/efficiencies. Familiar with reporting/workflow tools.

2 (Approaches):
 Aware of process improvement/automation, limited hands-on experience. Basic reporting understanding, may lack complex tool experience.

1 (Below):
 Little/no experience in process improvement, automation, or scalable solutions.

Overall Requirements & Communication (Pass/Fail)
Pass:
 Meets 2+ yrs Ad Ops/Acc Mgt/CS/Client Ops AND 2+ yrs team mgt (cross-functional). Communication clear for senior stakeholders.

Fail:
 Does not meet experience minimums OR communication is a concern.
`;

function RoleCreationForm() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createRole(title, description, oldRubricTemplate);
            alert('Role created and rubric generated successfully!'); // Use alert for simplicity, consider custom modal for production
            navigate('/'); // Navigate back to the role list
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="creation-form">
            <h2>Create New Role</h2>
            <p className="form-description">Paste the Job Description below. An evaluation rubric will be automatically generated based on the provided template.</p>
            <label>
                Role Title:
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
                Job Description:
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Paste the full Job Description here..."
                    required
                />
            </label>
            <button type="submit" disabled={loading}>
                {loading ? 'Creating Role & Generating Rubric...' : 'Create Role & Generate Rubric'}
            </button>
            {error && <div className="error-message">{error}</div>}
        </form>
    );
}

export default RoleCreationForm;
