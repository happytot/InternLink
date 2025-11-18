'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Adjust this path if needed
import CoordinatorSidebar from '../../components/CoordinatorSidebar'; // Adjust this path
import { toast } from 'sonner';
import { FaUserGraduate, FaBuilding, FaBriefcase } from 'react-icons/fa'; // Added icons
import './internships.css'; // Using the provided CSS

export default function CoordinatorPlacements() {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPlacements = async () => {
        setLoading(true);
        try {
            // Fetch applications where status is 'approved_by_coordinator' (Active Internship)
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

    const formatStatus = (status) => {
        if (!status) return 'N/A';
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

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
                    <p className="empty-state-text">No interns are currently registered and active.</p>
                ) : (
                    <div className="placements-list">
                        {placements.map((app) => (
                            <div key={app.id} className="placement-card">
                                <h3 className="intern-name">
                                    <FaUserGraduate style={{ marginRight: '8px' }} />
                                    {app.profiles?.fullname}
                                </h3>
                                <p><strong>Email:</strong> {app.profiles?.email}</p>
                                <p><strong>Department:</strong> {app.profiles?.department || 'N/A'}</p>
                                
                                <hr className="card-separator" />
                                
                                <p>
                                    <FaBuilding style={{ marginRight: '8px', color: '#3498db' }} />
                                    <strong>Company:</strong> {app.job_posts?.companies?.name || 'Unknown'}
                                </p>
                                <p>
                                    <FaBriefcase style={{ marginRight: '8px', color: '#2ecc71' }} />
                                    <strong>Role:</strong> {app.job_posts?.title}
                                </p>
                                
                                <div className={`status-badge ${app.status}`}>
                                    {formatStatus(app.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}