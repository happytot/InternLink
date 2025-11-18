// app/coordinator/placements/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Adjust this path if needed
import CoordinatorSidebar from '../../components/CoordinatorSidebar'; // Adjust this path
import { toast } from 'sonner';
import './internships.css'; // We'll keep using this CSS

export default function CoordinatorPlacements() {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPlacements = async () => {
        setLoading(true);
        try {
            // --- THIS IS THE FIXED QUERY ---
            // We are now using the explicit foreign key names
            // that we know work from your other pages.
            const { data, error } = await supabase
                .from("job_applications")
                .select(`
                    id,
                    status,
                    profiles:profiles!fk_job_applications_intern ( fullname, email, department ),
                    job_posts:job_posts!fk_job_applications_job ( 
                        title, 
                        companies ( name ) 
                    )
                `)
                // This is the "Active Internship" status:
                .eq("status", "approved_by_coordinator"); 

            if (error) throw error;
            
            setPlacements(data || []);
        } catch (err) {
            console.error("Error fetching placements:", err.message); 
            toast.error(`Failed to load placements: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlacements();
    }, []);

    return (
        <div className="coordinator-page">
            <CoordinatorSidebar />
            <div className="placements-content">
                <div className="header-section">
                    <h2>Active & Registered Internships</h2>
                </div>

                {loading ? (
                    <p>Loading active interns...</p>
                ) : placements.length === 0 ? (
                    <p>No interns are currently registered and active.</p>
                ) : (
                    <div className="placements-list">
                        {placements.map((app) => (
                            <div key={app.id} className="placement-card">
                                <h3>{app.profiles?.fullname}</h3>
                                <p><strong>Email:</strong> {app.profiles?.email}</p>
                                <p><strong>Department:</strong> {app.profiles?.department || 'N/A'}</p>
                                <hr style={{ margin: '12px 0' }} />
                                {/* Use the corrected data structure */}
                                <p><strong>Company:</strong> {app.job_posts?.companies?.name || 'Unknown'}</p>
                                <p><strong>Role:</strong> {app.job_posts?.title}</p>
                                
                                <p className="status">
                                    {app.status.replace(/_/g, ' ')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}