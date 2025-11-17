'use client';

// ✨ FIXED: Removed unused 'use' import
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ✨ FIXED: Used the recommended '@/' path alias for robustness
import { supabase } from '../../../lib/supabaseClient'; 
import './Profile.css';
import Header from '../../components/Header';
import InternNav from '../../components/InternNav';

// ✅ Define standard departments for logic
const STANDARD_DEPARTMENTS = ['CCS', 'CBA', 'CHTM', 'CEA'];

const INITIAL_STATE = {
    fullName: '',
    email: '',
    phone: '',
    summary: '',
    department: '', // ✅ 1. ADDED TO STATE
    customDepartment: '', // ✅ 1. ADDED TO STATE
    education: [{ institution: '', degree: '', years: '' }],
    skills: [],
    newSkillInput: '',
    profilePicURL: '',
    resumeURL: '',
    resumeFileName: '',
};

export default function Profile() {
    const [profileData, setProfileData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const router = useRouter();

    // --- Data Fetching Effect (SUPABASE) ---
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);

            // 1. Get the authenticated user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setLoading(false);
                setMessage("User not logged in.");
                console.error(userError || 'No user found');
                return;
            }

            setUserId(user.id);

            // 2. Fetch the profile from the 'profiles' table
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                    throw error;
                }

                if (data) {
                    // ✅ 2. ADDED LOGIC TO HANDLE CUSTOM DEPARTMENT
                    const savedDept = data.department || '';
                    const isStandard = STANDARD_DEPARTMENTS.includes(savedDept);

                    setProfileData(prev => ({
                        ...prev,
                        fullName: data.fullname || '',
                        email: user.email || '',
                        phone: data.phone || '',
                        summary: data.summary || '',
                        education: data.education ?? [{ institution: '', degree: '', years: '' }],
                        skills: data.skills || [],
                        profilePicURL: data.profile_pic_url || '',
                        resumeURL: data.resume_url || '',
                        resumeFileName: data.resume_file_name || '',
                        // If department is standard, set it. If not, or if empty, set to 'Other' or ''
                        department: isStandard ? savedDept : (savedDept ? 'Other' : ''),
                        // If department is custom, fill the custom text box
                        customDepartment: isStandard ? '' : savedDept
                    }));

                } else {
                    // No profile found, but user is logged in. Set email.
                    setProfileData(prev => ({ ...prev, email: user.email }));
                    setMessage("Profile not found. Start building it!");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setMessage("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []); // Run once on component mount

    // --- ✅ 2. ADD THE LOGOUT FUNCTION ---
    const handleLogout = async () => {
        setIsSubmitting(true); // Disable buttons
        setMessage('Logging out...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push('/auth/internAuthPage'); // Redirect to login page
        } catch (error) {
            console.error('Error logging out:', error.message);
            setMessage('Error logging out. Please try again.');
            setIsSubmitting(false); // Re-enable buttons on failure
        }
    };
    
    // --- File Handling (REAL UPLOADS) ---
    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) {
            setMessage("Please select a file. User must be logged in.");
            return;
        }

        setMessage('Uploading profile picture...');
        setIsSubmitting(true); // Disable save button during upload

        // 1. Define a unique path
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`; // ✅ BUG FIX: Removed leading '/'

        try {
            // 2. Upload the file to the 'avatars' bucket
            //    'upsert: true' will overwrite any existing file with the same name
            const { error: uploadError } = await supabase.storage
                .from('avatars') // ⚠️ NOTE: Make sure 'avatars' is your bucket name!
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 3. Get the public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            // 4. Set the REAL URL in state
            setProfileData(prev => ({ ...prev, profilePicURL: urlData.publicUrl }));
            setMessage('✅ Picture uploaded! Click "Save Profile" to keep it.');

        } catch (error) {
            console.error('Error uploading profile picture:', error);
            setMessage(`Failed to upload picture: ${error.message}`);
        } finally {
            setIsSubmitting(false); // Re-enable save button
        }
    };
    
    const handleResumeFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) {
            setMessage("Please select a file. User must be logged in.");
            return;
        }

        setMessage('Uploading resume...');
        setIsSubmitting(true); // Disable save button during upload

        // 1. Define a unique path
        const filePath = `${userId}/${file.name}`;

        try {
            // 2. Upload the file to the 'resumes' bucket
            const { error: uploadError } = await supabase.storage
                .from('resumes') // ⚠️ NOTE: Make sure 'resumes' is your bucket name!
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 3. Get the public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath);

            // 4. Set the REAL URL in state
            setProfileData(prev => ({
                ...prev,
                resumeURL: urlData.publicUrl,
                resumeFileName: file.name
            }));
            setMessage('✅ Resume uploaded! Click "Save Profile" to keep it.');

        } catch (error) {
            console.error('Error uploading resume:', error);
            setMessage(`Failed to upload resume: ${error.message}`);
        } finally {
            setIsSubmitting(false); // Re-enable save button
        }
    };

    const handleRemoveResume = () => {
        if (window.confirm("Are you sure you want to remove your uploaded resume?")) {
            setProfileData(prev => ({ ...prev, resumeURL: '', resumeFileName: '' }));
            setMessage("Resume removed. Click 'Save Profile' to confirm the deletion.");
        }
    };

    // --- Generic Form Handlers ---
    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleEducationChange = (index, e) => {
        const { name, value } = e.target;
        const newEducation = profileData.education.map((edu, i) =>
            i === index ? { ...edu, [name]: value } : edu
        );
        setProfileData(prev => ({ ...prev, education: newEducation }));
    };

    const addEducationField = () => {
        setProfileData(prev => ({
            ...prev,
            education: [...prev.education, { institution: '', degree: '', years: '' }]
        }));
    };
    
    const addSkill = () => {
        const newSkill = profileData.newSkillInput.trim();
        if (newSkill && !profileData.skills.includes(newSkill)) {
            setProfileData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill],
                newSkillInput: ''
            }));
        }
    };

    const removeSkill = (skillToRemove) => {
        setProfileData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    // --- Submit Handler (SUPABASE) ---
    // ✨ THIS IS THE MODIFIED FUNCTION ✨
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setMessage("Cannot save: User not authenticated.");
            return;
        }

        setIsSubmitting(true);
        setMessage('Saving profile...');

        const finalDepartment = profileData.department === 'Other' 
            ? profileData.customDepartment 
            : profileData.department;

        const dataToSave = {
            fullname: profileData.fullName,
            email: profileData.email,
            phone: profileData.phone,
            summary: profileData.summary,
            department: finalDepartment,
            education: profileData.education,
            skills: profileData.skills,
            profile_pic_url: profileData.profilePicURL,
            resume_url: profileData.resumeURL,
            resume_file_name: profileData.resumeFileName,
            updated_at: new Date().toISOString(),
        };

        try {
            // --- STEP 1: Save the profile data (as before) ---
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            let error;
            if (existingProfile) {
                ({ error } = await supabase
                    .from('profiles')
                    .update(dataToSave)
                    .eq('id', userId));
            } else {
                ({ error } = await supabase
                    .from('profiles')
                    .insert([{ id: userId, ...dataToSave }]));
            }

            if (error) throw error;

            // --- ✨ STEP 2: (NEW!) Automatically update the embedding ---
            setMessage('Profile saved! Now updating AI matches...');
            try {
                await fetch(`/api/embedding/intern`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ intern_id: userId })
                });
                // Both steps were successful
                setMessage('Profile saved & AI matches updated! 🎉');
            } catch (embedError) {
                console.error("Embedding update failed:", embedError);
                // The profile saved, but embedding failed. Still a "soft" success.
                setMessage('Profile saved, but failed to update AI matches. Please try again.');
            }
            // -----------------------------------------------------------

        } catch (err) {
            console.error("Error saving profile:", err);
            setMessage("Failed to save profile. Please try again.");
        }
        
        setIsSubmitting(false); 
    };

    if (loading) {
        return <div className="profile-page-container">Loading profile editor...</div>;
    }
    
    // --- JSX Return ---
    return (
        <div className="profile-wrapper">
            <Header />
            <div className="profile-content-area">
                <main className="editor-main-form">
                    <h1 className="page-title">📝 My Profile & Application Data</h1>

                    {/* Notification/Message Area */}
                    {message && message !== 'Saving...' && (
                        <div className={`alert-message status-${message.includes('success') || message.includes('🎉') ? 'accepted' : 'info'}`}>
                            {message}
                        </div>
                    )}
                    
                    {/* Profile Picture Section */}
                    <section className="profile-card section-profile-pic">
                        {/* ... (No changes here) ... */}
                        <h2 className="section-title">Profile Picture</h2>
                        <div className="profile-pic-uploader">
                            <div className="profile-pic-container">
                                {profileData.profilePicURL ? (
                                    <img src={profileData.profilePicURL} alt="User Profile" className="profile-avatar" />
                                ) : (
                                    <div className="profile-avatar placeholder-avatar">👤</div>
                                )}
                            </div>
                            <div className="profile-pic-controls">
                                <label htmlFor="profilePicUpload" className="btn-secondary file-upload-label">
                                    {profileData.profilePicURL ? 'Switch Photo' : 'Upload Photo'}
                                    <input
                                        type="file"
                                        id="profilePicUpload"
                                        accept="image/*"
                                        onChange={handleProfilePicChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {profileData.profilePicURL && (
                                    <button
                                        type="button"
                                        className="btn-secondary delete-photo-btn"
                                        onClick={() => setProfileData(prev => ({ ...prev, profilePicURL: '' }))}
                                    >
                                        Delete
                                    </button>
                                )}
                                <p className="file-hint">JPG or PNG allowed. Max 2MB.</p>
                            </div>
                        </div>
                    </section>

                    {/* Contact Information & Summary */}
                    <section className="profile-card section-contact-info">
                        <h2 className="section-title">Personal & Contact Details</h2>
                        
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input type="text" id="fullName" name="fullName" value={profileData.fullName} onChange={handleFieldChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address (Read-Only)</label>
                                <input type="email" id="email" name="email" value={profileData.email} onChange={handleFieldChange} disabled />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone" value={profileData.phone} onChange={handleFieldChange} />
                            </div>
                        </div>

                        {/* ✅ 4. ADDED THE DEPARTMENT DROPDOWN */}
                        <div className="form-group">
                            <label htmlFor="department">Department / College</label>
                            <select 
                                id="department" 
                                name="department" 
                                value={profileData.department} 
                                onChange={handleFieldChange}
                                required
                            >
                                <option value="" disabled>Select your department</option>
                                <option value="CCS">College of Computer Studies</option>
                                <option value="CBA">College of Business Administration</option>
                                <option value="CHTM">College of Hospitality & Tourism Mgmt</option>
                                <option value="CEA">College of Engineering & Architecture</option>
                                <option value="Other">Other (Please specify)</option>
                            </select>
                        </div>

                        {/* ✅ 4. ADDED CONDITIONAL INPUT FOR "OTHER" */}
                        {profileData.department === 'Other' && (
                            <div className="form-group">
                                <label htmlFor="customDepartment">Custom Department Name</label>
                                <input
                                    type="text"
                                    id="customDepartment"
                                    name="customDepartment"
                                    value={profileData.customDepartment}
                                    onChange={handleFieldChange}
                                    placeholder="e.g., College of Arts and Sciences"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="summary">Professional Summary</label>
                            <textarea
                                id="summary"
                                name="summary"
                                rows="6"
                                value={profileData.summary}
                                onChange={handleFieldChange}
                                placeholder="Write a compelling summary highlighting your motivation and key skills..."
                            />
                        </div>
                    </section>
                    
                    {/* Education History */}
                    <section className="profile-card section-education">
                        {/* ... (No changes here) ... */}
                        <h2 className="section-title">Education History</h2>
                        <div className="education-grid-wrapper">
                            {profileData.education.map((edu, index) => (
                                <div key={index} className="education-item-grid">
                                    <input type="text" name="institution" value={edu.institution} onChange={(e) => handleEducationChange(index, e)} placeholder="Institution Name" className="input-institution" />
                                    <input type="text" name="degree" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} placeholder="Degree/Major" className="input-degree" />
                                    <input type="text" name="years" value={edu.years} onChange={(e) => handleEducationChange(index, e)} placeholder="Years (e.g., 2019-2023)" className="input-years" />
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addEducationField} className="btn-secondary add-education-btn">➕ Add New Education</button>
                    </section>

                    {/* Skills */}
                    <section className="profile-card section-skills">
                        {/* ... (No changes here) ... */}
                        <h2 className="section-title">Key Skills</h2>
                        <div className="skill-tags">
                            {profileData.skills.map((skill, index) => (
                                <span key={index} className="skill-badge">
                                    {skill} <span className="remove-skill" onClick={() => removeSkill(skill)}>×</span>
                                </span>
                            ))}
                        </div>
                        <div className="skill-input-bar">
                            <input
                                type="text"
                                placeholder="Add a skill (e.g., Python, Marketing, Figma)"
                                name="newSkillInput"
                                value={profileData.newSkillInput}
                                onChange={handleFieldChange}
                                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                            />
                            <button type="button" onClick={addSkill} className="btn-primary add-skill-btn">Add</button>
                        </div>
                    </section>
                    
                    {/* Submit Button */}
                    <div className="submit-action-bar">
                        {/* ... (No changes here) ... */}
                        <p className="user-info">User ID: {userId ? userId.slice(0, 8) : 'N/A'}...</p>
                        <button
                            className="btn-primary save-button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            💾 {isSubmitting ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>

                </main>

                {/* --- RIGHT COLUMN: Resume Upload --- */}
                <aside className="resume-upload-sidebar">
                    {/* ... (No changes here) ... */}
                    <section className="profile-card section-resume-upload">
                        <h2 className="section-title">📁 Upload Resume (CV)</h2>
                        {profileData.resumeURL ? (
                            <div className="uploaded-file-status">
                                <p className="file-name">✅ <strong>Attached:</strong> {profileData.resumeFileName || 'Your_Resume.pdf'}</p>
                                <div className="file-actions">
                                    <button
                                        type="button"
                                        className="btn-primary view-resume-btn"
                                        onClick={() => setIsResumeModalOpen(true)}
                                    >
                                        View Attached Resume
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary delete-resume-btn"
                                        onClick={handleRemoveResume}
                                    >
                                        Delete / Switch
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="no-file-status">
                                <p>No resume is currently attached. Upload a file to apply for internships.</p>
                                <label htmlFor="resumeFileUpload" className="btn-primary file-upload-label">
                                    Upload Resume (.pdf, .docx)
                                    <input
                                        type="file"
                                        id="resumeFileUpload"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleResumeFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        )}
                        <p className="file-hint">Max file size 5MB. PDF and DOCX formats preferred.</p>
                    </section>

                    {/* ✅ 3. ADD THE NEW LOGOUT SECTION HERE */}
                    <section className="profile-card section-account-actions">
                        <h2 className="section-title">Account</h2>
                        <button
                            className="btn-danger logout-btn"
                            onClick={handleLogout}
                            disabled={isSubmitting}
                        >
                            Log Out
                        </button>
                    </section>
                </aside>
            </div>

            {/* BOTTOM NAVIGATION BAR */}
            <InternNav />

            {/* Resume Modal Implementation */}
            <ResumeModal
                isOpen={isResumeModalOpen}
                onClose={() => setIsResumeModalOpen(false)}
                resumeURL={profileData.resumeURL}
                resumeFileName={profileData.resumeFileName}
            />
        </div>
    );
};

// --- Modal Component (Moved Outside) ---
const ResumeModal = ({ isOpen, onClose, resumeURL, resumeFileName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2 className='modal-title'>Preview Attached Resume</h2>
                <p className='modal-hint'>Note: This is a placeholder for your PDF/DOCX viewer.</p>
                
                <div className="resume-viewer-placeholder">
                    <p>Viewing: <strong>{resumeFileName || 'Uploaded Resume'}</strong></p>
                    <a href={resumeURL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: '15px' }}>
                        Open in New Tab (Direct Link)
                    </a>
                </div>
            </div>
        </div>
    );
};