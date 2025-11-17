// app/coordinator/placements/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Adjust this path if needed
import CoordinatorSidebar from '../../components/CoordinatorSidebar'; // Adjust this path
import { toast } from 'sonner';
import './placements.css'; // Make sure this CSS file is imported

export default function CoordinatorPlacements() {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPlacements = async () => {
        setLoading(true);
        try {
            // ✅ --- START: CORRECTED SELECT QUERY ---
            // This query now uses the exact foreign key names from your other files
            // and correctly performs the nested join from job_posts -> companies.
            const { data, error } = await supabase
                .from("job_applications")
                .select(`
                    id,
                    status,
                    profiles:profiles!fk_job_applications_intern ( fullname, email ),
                    job_posts:job_posts!fk_job_applications_job ( 
                        title, 
                        companies ( name ) 
                    )
                `)
                .eq("status", "Pending_Coordinator_Approval");
            // ✅ --- END: CORRECTED SELECT QUERY ---

            if (error) throw error; // The error object was being thrown here
            
            setPlacements(data || []);
        } catch (err) {
            // This will now print the *actual* Supabase error message
            console.error("Error fetching placements:", err.message); 
            toast.error(`Failed to load placements: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlacements();
    }, []);

    const handlePlacementReview = async (applicationId, newStatus) => {
        const confirmText = newStatus === 'Registered'
            ? "Are you sure you want to register this internship?"
            : "Are you sure you want to deny this placement?";

        if (!confirm(confirmText)) return;

        try {
            const { error } = await supabase
                .from("job_applications")
                .update({ status: newStatus })
                .eq("id", applicationId);

            if (error) throw error;

            toast.success(`Placement has been ${newStatus}.`);
            fetchPlacements(); // Refresh the list
        } catch (err) {
            console.error("Error updating placement status:", err);
            toast.error("Failed to update status.");
        }
    };

    return (
        <div className="coordinator-page">
            <CoordinatorSidebar />
            <div className="placements-content">
                <div className="header-section">
                    <h2>Pending Internship Placements</h2>
                </div>

                {loading ? (
                    <p>Loading pending placements...</p>
                ) : placements.length === 0 ? (
                    <p>No placements are currently awaiting your approval.</p>
                ) : (
                    <div className="placements-list">
                        {placements.map((app) => (
                            <div key={app.id} className="placement-card">
                                <h3>{app.profiles?.fullname}</h3>
                                <p><strong>Email:</strong> {app.profiles?.email}</p>
                                {/* Use the nested join data */}
                                <p><strong>Company:</strong> {app.job_posts?.companies?.name || 'Unknown Company'}</p>
                                <p><strong>Role:</strong> {app.job_posts?.title}</p>
                                <p className="status">{app.status.replace('_', ' ')}</p>

                                <div className="action-buttons">
                                    <button
                                        onClick={() => handlePlacementReview(app.id, 'Registered')}
                                        className="approve-btn"
                                    >
                                        Finalize Registration
                                    </button>
                                    <button
                                        onClick={() => handlePlacementReview(app.id, 'Denied_By_Coordinator')}
                                        className="reject-btn"
                                    >
                                        Deny Placement
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}