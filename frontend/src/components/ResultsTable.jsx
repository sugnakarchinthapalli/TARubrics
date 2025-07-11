// frontend/src/components/ResultsTable.jsx

import React from 'react';

function ResultsTable({ results }) {
    if (!results || results.length === 0) {
        return <p className="no-data-message">No resumes have been screened for this role yet.</p>;
    }

    // Function to download CSV
    const downloadCsv = () => {
        const headers = ["File Name", "Score", "Pass/Fail", "Justification", "Cited Evidence", "Competency Scores"];
        const rows = results.map(result => {
            const details = result.evaluation_details || {};
            const competencyScores = details.competency_scores ?
                Object.entries(details.competency_scores).map(([key, value]) => `${key}: ${value}`).join('; ') : '';
            const citedEvidence = details.cited_evidence ? details.cited_evidence.join('; ') : '';

            return [
                result.file_name,
                result.score,
                details.pass_fail_status || 'N/A',
                JSON.stringify(details.justification || ''), // Stringify to handle commas in text
                JSON.stringify(citedEvidence),
                JSON.stringify(competencyScores)
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Enclose in quotes and escape
        });

        const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'candidate_evaluation_results.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="results-table-container">
            <h3>Screening Results</h3>
            <button onClick={downloadCsv} className="download-csv-button">Download as CSV</button>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Score</th>
                            <th>Pass/Fail</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(result => (
                            <tr key={result.id}>
                                <td>{result.file_name}</td>
                                <td>{result.score} / 100</td>
                                <td>{result.evaluation_details?.pass_fail_status || 'N/A'}</td>
                                <td>
                                    {/* Using a simple alert for details. Consider a custom modal for better UX */}
                                    <button
                                        className="view-details-button"
                                        onClick={() =>
                                            alert(
                                                `Justification:\n${result.evaluation_details?.justification || 'N/A'}\n\n` +
                                                `Competency Scores:\n${
                                                    result.evaluation_details?.competency_scores
                                                        ? Object.entries(result.evaluation_details.competency_scores)
                                                              .map(([key, value]) => `  ${key}: ${value}`)
                                                              .join('\n')
                                                        : 'N/A'
                                                }\n\n` +
                                                `Cited Evidence:\n${
                                                    result.evaluation_details?.cited_evidence
                                                        ? result.evaluation_details.cited_evidence.join('\n- ')
                                                        : 'N/A'
                                                }`
                                            )
                                        }
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultsTable;
