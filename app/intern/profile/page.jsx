'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner'; // ✨ 1. Import Sonner

import { supabase } from '../../../lib/supabaseClient'; 
import './Profile.css';
import Header from '../../components/Header';
import InternNav from '../../components/InternNav';

const STANDARD_DEPARTMENTS = ['CCS', 'CBA', 'CHTM', 'CEA'];

const INITIAL_STATE = {
    fullName: '',
    email: '',
    phone: '',
    summary: '',
    department: '',
    customDepartment: '',
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
    // const [message, setMessage] = useState(''); // ✨ 2. Removed message state
    const [userId, setUserId] = useState(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const router = useRouter();

    // --- Data Fetching Effect (SUPABASE) ---
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);

            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setLoading(false);
                toast.error("You must be logged in to view this page.");
                router.push('/auth/internAuthPage'); // ✨ This is the redirect
                return; // Stop the rest of the function
            }

            setUserId(user.id);

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (data) {
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
                        department: isStandard ? savedDept : (savedDept ? 'Other' : ''),
                        customDepartment: isStandard ? '' : savedDept
                    }));
                } else {
                    setProfileData(prev => ({ ...prev, email: user.email }));
                    toast.info("Profile not found. Start building it!"); // ✨ 3. Use Sonner
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                toast.error("Failed to load profile data."); // ✨ 3. Use Sonner
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // --- Logout Function ---
    const handleLogout = async () => {
        setIsSubmitting(true);
        const logoutToast = toast.loading('Logging out...'); // ✨ 3. Use Sonner
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.dismiss(logoutToast);
            router.push('/auth/internAuthPage');
        } catch (error) {
            console.error('Error logging out:', error.message);
            toast.error('Error logging out. Please try again.', { id: logoutToast }); // ✨ 3. Use Sonner
            setIsSubmitting(false);
        }
    };
    
    // --- File Handling (Profile Picture) ---
    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) {
            toast.error("Please select a file to upload."); // ✨ 3. Use Sonner
            return;
        }

        setIsSubmitting(true);
        const uploadToast = toast.loading('Uploading profile picture...'); // ✨ 3. Use Sonner

        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            setProfileData(prev => ({ ...prev, profilePicURL: urlData.publicUrl }));
            toast.success('Picture uploaded! Click "Save Profile" to keep it.', { id: uploadToast }); // ✨ 3. Use Sonner

        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error(`Failed to upload picture: ${error.message}`, { id: uploadToast }); // ✨ 3. Use Sonner
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- File Handling (Resume) ---
    const handleResumeFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) {
            toast.error("Please select a file to upload."); // ✨ 3. Use Sonner
            return;
        }

        setIsSubmitting(true);
        const uploadToast = toast.loading('Uploading resume...'); // ✨ 3. Use Sonner

        const filePath = `${userId}/${file.name}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath);

            setProfileData(prev => ({
                ...prev,
                resumeURL: urlData.publicUrl,
                resumeFileName: file.name
            }));
            toast.success('Resume uploaded! Click "Save Profile" to keep it.', { id: uploadToast }); // ✨ 3. Use Sonner

        } catch (error) {
            console.error('Error uploading resume:', error);
            toast.error(`Failed to upload resume: ${error.message}`, { id: uploadToast }); // ✨ 3. Use Sonner
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveResume = () => {
        if (window.confirm("Are you sure you want to remove your uploaded resume?")) {
            setProfileData(prev => ({ ...prev, resumeURL: '', resumeFileName: '' }));
            toast.info("Resume removed. Click 'Save Profile' to confirm the deletion."); // ✨ 3. Use Sonner
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            toast.error("Cannot save: User not authenticated."); // ✨ 3. Use Sonner
            return;
        }

        setIsSubmitting(true);
        const saveToast = toast.loading('Saving profile...'); // ✨ 3. Use Sonner

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
            // --- STEP 1: Save the profile data ---
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

            // --- STEP 2: Update the embedding ---
            toast.loading('Profile saved! Updating AI matches...', { id: saveToast }); // ✨ 3. Use Sonner
            
            try {
                await fetch(`/api/embedding/intern`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ intern_id: userId })
                });
                toast.success('Profile saved & AI matches updated! 🎉', { id: saveToast }); // ✨ 3. Use Sonner
            } catch (embedError) {
                console.error("Embedding update failed:", embedError);
                toast.warning('Profile saved, but failed to update AI matches.', { id: saveToast }); // ✨ 3. Use Sonner
            }
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error(`Failed to save profile: ${err.message}`, { id: saveToast }); // ✨ 3. Use Sonner
        }
        
        setIsSubmitting(false); 
    };

    if (loading) {
        return <div className="profile-page-container">Loading profile editor...</div>;
    }
    
return (
    <div className="profile-wrapper">
        <Toaster position="top-center" richColors />
        <Header />
        <div className="profile-content-area">
            
            {/* ========================================
            ✨ 1. MAIN COLUMN (NOW SIMPLIFIED)
            This *only* contains the Page Title, Header Card, and Save Bar.
            ========================================
            */}
            <main className="editor-main-form">
                <h1 className="page-title">📝 My Profile & Application Data</h1>

                {/* --- Unified Profile Header Card --- */}
                <section className="profile-card section-profile-header">
                    
                    {/* --- profile-header-grid (pic + details) --- */}
                    <div className="profile-header-grid">
                        <div className="profile-header-pic-col">
                            {/* ... Profile Picture uploader JSX ... */}
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
                                    <label htmlFor="profilePicUpload" className="btn-secondary-file-upload-label">
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
                                            className="btn-secondary-delete-photo-btn"
                                            onClick={() => setProfileData(prev => ({ ...prev, profilePicURL: '' }))}
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <p className="file-hint">JPG or PNG allowed. Max 2MB.</p>
                                </div>
                            </div>
                        </div>
                        <div className="profile-header-details-col">
                            {/* ... Personal & Contact Details JSX ... */}
                            <h2 className="section-title">Personal & Contact Details</h2>
                            <div className="form-grid-3">
                                {/* FullName, Email, Phone */}
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
                            <div className="form-group">
                                {/* Department Dropdown */}
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
                            {profileData.department === 'Other' && (
                                <div className="form-group">
                                    {/* Custom Department Input */}
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
                        </div>
                    </div>
                    
                    {/* --- Summary Row (full width) --- */}
                    <div className="profile-header-summary-row">
                        <h2 className="section-title">Professional Summary</h2>
                        <div className="form-group">
                            <textarea
                                id="summary"
                                name="summary"
                                rows="6"
                                value={profileData.summary}
                                onChange={handleFieldChange}
                                placeholder="Write a compelling summary highlighting your motivation and key skills..."
                            />
                        </div>
                    </div>
                </section>
                
                {/* ✨ The 2-column details-grid is GONE from here */}

                {/* --- Submit Button --- */}
                <div className="submit-action-bar">
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

            {/* ========================================
            ✨ 2. SIDEBAR (NOW A STACK OF CARDS)
            This now holds Resume, Skills, Education, and Account.
            ========================================
            */}
            <aside className="resume-upload-sidebar">
                
                {/* --- Card 1: Resume Upload --- */}
                <section className="profile-card section-resume-upload">
                    <h2 className="section-title">📁 Upload Resume (CV)</h2>
                    {profileData.resumeURL ? (
                        <div className="uploaded-file-status">
                            {/* ... Uploaded state JSX ... */}
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
                            {/* ... No file state JSX ... */}
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

                {/* --- ✨ Card 2: Skills (MOVED HERE) --- */}
                <section className="profile-card section-skills">
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

                {/* --- ✨ Card 3: Education (MOVED HERE) --- */}
                <section className="profile-card section-education">
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

                {/* --- Card 4: Account --- */}
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