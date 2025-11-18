'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

// 1. Supabase Client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 2. Lucide Icon Imports (iOS/Mac Theme)
import { 
    User, Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench, Plus, X, 
    FileText, Upload, Eye, Trash2, LogOut, Save, Loader2, MinusCircle, FileQuestion, Users
} from 'lucide-react';

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

// ========================================
// 🛠️ HELPER COMPONENTS (for clean structure)
// ========================================

// Reusable Section Title with Icon
const SectionTitle = ({ icon: Icon, title }) => (
    <h2 className="section-title">
        <Icon size={24} color="var(--primary-orange)" />
        {title}
    </h2>
);

// Education Item Component
const EducationItem = ({ index, edu, onChange, onRemove }) => (
    <div className="education-item-grid" key={index}>
        <input 
            type="text" 
            placeholder="Institution Name" 
            name="institution"
            value={edu.institution}
            onChange={(e) => onChange(index, e)}
        />
        <input 
            type="text" 
            placeholder="Degree / Field of Study" 
            name="degree"
            value={edu.degree}
            onChange={(e) => onChange(index, e)}
        />
        <input 
            type="text" 
            placeholder="Years (e.g., 2018-2022)" 
            name="years"
            value={edu.years}
            onChange={(e) => onChange(index, e)}
        />
        {index > 0 && (
            <button 
                type="button" 
                onClick={() => onRemove(index)}
                className="btn-icon-danger"
                title="Remove education entry"
            >
                <MinusCircle size={20} />
            </button>
        )}
    </div>
);

// Skeleton Loading Component
const SkeletonCard = () => (
    <div className="profile-wrapper">
        <div className="profile-content-area is-loading">
            <main className="editor-main-form">
                <div className="page-title-skeleton"></div>
                
                {/* Profile/Personal Info Skeleton */}
                <div className="profile-card skeleton-profile-card">
                    <div className="skeleton-line full"></div>
                    <div className="profile-header-grid">
                        <div className="profile-header-pic-col">
                            <div className="profile-pic-container skeleton-avatar-placeholder"></div>
                            <div className="skeleton-line half mt-3"></div>
                            <div className="skeleton-line small"></div>
                        </div>
                        <div className="profile-header-info-col">
                            <div className="skeleton-line short"></div>
                            <div className="skeleton-input full"></div>
                            <div className="skeleton-input full"></div>
                            <div className="skeleton-input full"></div>
                            <div className="skeleton-input full"></div>
                        </div>
                    </div>
                </div>

                {/* Submit Bar Skeleton */}
                <div className="submit-action-bar skeleton-submit-bar">
                    <div className="skeleton-line small"></div>
                    <div className="skeleton-button"></div>
                </div>

            </main>
            
            <aside className="resume-upload-sidebar">
                {/* Resume Card Skeleton */}
                <div className="profile-card skeleton-card">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-input small"></div>
                    <div className="skeleton-line half"></div>
                </div>

                {/* Skills Card Skeleton */}
                <div className="profile-card skeleton-card">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line full"></div>
                    <div className="skeleton-line short"></div>
                </div>
            </aside>
        </div>
    </div>
);


// ========================================
// 🎯 MAIN PROFILE COMPONENT
// ========================================
export default function Profile() {
    const supabase = createClientComponentClient();
    const [profileData, setProfileData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const router = useRouter();

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);

            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setLoading(false);
                toast.error("You must be logged in to view this page.");
                router.push('/auth/internAuthPage');
                return;
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
                    toast.info("Profile not found. Start building it!");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                toast.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [supabase, router]);


    // --- Handlers ---

    // Generic field change
    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    // Education
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
    
    const removeEducationField = (index) => {
        setProfileData(prev => ({
            ...prev,
            education: profileData.education.filter((_, i) => i !== index),
        }));
    };

    // Skills
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

    // Logout
    const handleLogout = async () => {
        setIsSubmitting(true);
        const logoutToast = toast.loading('Logging out...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.dismiss(logoutToast);
            router.push('/auth/internAuthPage');
        } catch (error) {
            console.error('Error logging out:', error.message);
            toast.error('Error logging out. Please try again.', { id: logoutToast });
            setIsSubmitting(false);
        }
    };

    // File Handlers (Profile Pic / Resume)
    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) {
            toast.error("Please select a file to upload.");
            return;
        }

        setIsSubmitting(true);
        const uploadToast = toast.loading('Uploading profile picture...');

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
            toast.success('Picture uploaded! Click "Save Profile" to keep it.', { id: uploadToast });
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error(`Failed to upload picture: ${error.message}`, { id: uploadToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResumeFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) {
            toast.error("Please select a file to upload.");
            return;
        }

        setIsSubmitting(true);
        const uploadToast = toast.loading('Uploading resume...');

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
            toast.success('Resume uploaded! Click "Save Profile" to keep it.', { id: uploadToast });
        } catch (error) {
            console.error('Error uploading resume:', error);
            toast.error(`Failed to upload resume: ${error.message}`, { id: uploadToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveResume = () => {
        if (window.confirm("Are you sure you want to remove your uploaded resume?")) {
            setProfileData(prev => ({ ...prev, resumeURL: '', resumeFileName: '' }));
            toast.info("Resume removed. Click 'Save Profile' to confirm the deletion.");
        }
    };


    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            toast.error("Cannot save: User not authenticated.");
            return;
        }

        setIsSubmitting(true);
        const saveToast = toast.loading('Saving profile...');
        const finalDepartment = profileData.department === 'Other' 
            ? profileData.customDepartment 
            : profileData.department;
        
        const dataToSave = {
            fullname: profileData.fullName,
            phone: profileData.phone,
            summary: profileData.summary,
            department: finalDepartment,
            education: profileData.education.filter(edu => edu.institution || edu.degree || edu.years), // Clean up empty entries
            skills: profileData.skills,
            profile_pic_url: profileData.profilePicURL,
            resume_url: profileData.resumeURL,
            resume_file_name: profileData.resumeFileName,
            updated_at: new Date().toISOString(),
        };

        try {
            // STEP 1: Save the profile data
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

            // STEP 2: Update the embedding
            toast.loading('Profile saved! Updating AI matches...', { id: saveToast });
            try {
                await fetch(`/api/embedding/intern`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ intern_id: userId })
                });
                toast.success('Profile saved & AI matches updated! 🎉', { id: saveToast });
            } catch (embedError) {
                console.error("Embedding update failed:", embedError);
                toast.warning('Profile saved, but failed to update AI matches.', { id: saveToast });
            }
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error(`Failed to save profile: ${err.message}`, { id: saveToast });
        }
        
        setIsSubmitting(false); 
    };

    // --- Loading State Render ---
    if (loading) {
        return <SkeletonCard />; // Use the new Skeleton component
    }

    // --- Main Component Render ---
    return (
        <div className="profile-wrapper">
            <Toaster position="top-center" richColors />
            <Header /> 
            
            <form onSubmit={handleSubmit}>
                <div className="profile-content-area">
                    
                    {/* ========================================
                        ✨ 1. MAIN COLUMN (2/3 width)
                        ========================================
                    */}
                    <main className="editor-main-form">
                        <h1 className="page-title">
                            <Users size={32} color="var(--primary-dark)" style={{ marginRight: '10px' }} />
                            My Profile & Application Data
                        </h1>

                        {/* --- Bento Card 1: Personal Information & Photo --- */}
                        <section className="profile-card section-profile-header">
                            <SectionTitle icon={User} title="Personal & Contact Information" />
                            
                            <div className="profile-header-grid">
                                
                                {/* Profile Picture Uploader Column */}
                                <div className="profile-header-pic-col">
                                    <h3 className="section-title">Profile Photo</h3>
                                    <div className="profile-pic-uploader">
                                        <div className="profile-pic-container">
                                            {profileData.profilePicURL ? (
                                                <img src={profileData.profilePicURL} alt="User Profile" className="profile-avatar" />
                                            ) : (
                                                <div className="profile-avatar placeholder-avatar">👤</div>
                                            )}
                                        </div>
                                        <div className="profile-pic-controls">
                                            <label htmlFor="profilePicUpload" className="btn-secondary-file-upload-label" disabled={isSubmitting}>
                                                <Upload size={18} style={{ marginRight: '8px' }} />
                                                {profileData.profilePicURL ? 'Switch Photo' : 'Upload Photo'}
                                                <input
                                                    type="file"
                                                    id="profilePicUpload"
                                                    accept="image/*"
                                                    onChange={handleProfilePicChange}
                                                    style={{ display: 'none' }}
                                                    disabled={isSubmitting}
                                                />
                                            </label>
                                            {profileData.profilePicURL && (
                                                <button
                                                    type="button"
                                                    className="btn-secondary-delete-photo-btn"
                                                    onClick={() => setProfileData(prev => ({ ...prev, profilePicURL: '' }))}
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 size={18} style={{ marginRight: '8px' }} />
                                                    Delete Photo
                                                </button>
                                            )}
                                            <p className="file-hint">JPG or PNG allowed. Max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Contact Info Column */}
                                <div className="profile-header-info-col">
                                    <div className="form-group">
                                        <label htmlFor="fullName"><User size={16} /> Full Name</label>
                                        <input 
                                            type="text" 
                                            id="fullName" 
                                            name="fullName" 
                                            placeholder="John Doe"
                                            value={profileData.fullName}
                                            onChange={handleFieldChange}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="form-grid-3">
                                        <div className="form-group">
                                            <label htmlFor="email"><Mail size={16} /> Email (Cannot be changed)</label>
                                            <input 
                                                type="email" 
                                                id="email" 
                                                name="email" 
                                                value={profileData.email}
                                                disabled
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phone"><Phone size={16} /> Phone</label>
                                            <input 
                                                type="tel" 
                                                id="phone" 
                                                name="phone" 
                                                placeholder="(555) 123-4567"
                                                value={profileData.phone}
                                                onChange={handleFieldChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="location"><MapPin size={16} /> Location</label>
                                            <input 
                                                type="text" 
                                                id="location" 
                                                name="location" 
                                                placeholder="San Francisco, CA"
                                                value={profileData.location}
                                                onChange={handleFieldChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                                        <div className="form-group">
                                            <label htmlFor="department"><Briefcase size={16} /> Primary Department</label>
                                            <select
                                                id="department"
                                                name="department"
                                                value={profileData.department}
                                                onChange={handleFieldChange}
                                                disabled={isSubmitting}
                                            >
                                                <option value="" disabled>Select Department</option>
                                                {STANDARD_DEPARTMENTS.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                                <option value="Other">Other (Please specify)</option>
                                            </select>
                                        </div>
                                        {profileData.department === 'Other' && (
                                            <div className="form-group">
                                                <label htmlFor="customDepartment">Specify Department</label>
                                                <input
                                                    type="text"
                                                    id="customDepartment"
                                                    name="customDepartment"
                                                    value={profileData.customDepartment}
                                                    onChange={handleFieldChange}
                                                    placeholder="e.g., School of Medicine"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary / Headline Row */}
                            <div className="profile-header-summary-row">
                                <SectionTitle icon={Briefcase} title="Professional Summary" />
                                <div className="form-group">
                                    <textarea
                                        id="summary"
                                        name="summary"
                                        rows="4" 
                                        placeholder="Briefly describe your experience, career goals, and relevant academic background (200 words max)"
                                        value={profileData.summary}
                                        onChange={handleFieldChange}
                                        disabled={isSubmitting}
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        {/* --- Sticky Save Action Bar --- */}
                        <div className="submit-action-bar">
                            <p className="user-info">
                                Profile Status: {isSubmitting ? 'Updating...' : 'Ready to save'}
                            </p>
                            <button 
                                type="submit" 
                                className="btn-primary save-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="spin-icon" style={{ marginRight: '8px' }} />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} style={{ marginRight: '8px' }} />
                                        Save Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </main> 
                    
                    {/* ========================================
                        ✨ 2. SIDEBAR COLUMN (1/3 width) - Bento Stack
                        ========================================
                    */}
                    <aside className="resume-upload-sidebar">

                         {/* --- Bento Card 2: Resume Upload --- */}
                        <section className="profile-card section-resume">
                            <SectionTitle icon={FileText} title="Resume / CV" />
                            {profileData.resumeURL ? (
                                <div className="uploaded-file-status status-accepted">
                                    <p className="file-name"><FileText size={18} style={{ marginRight: '5px' }} /> {profileData.resumeFileName}</p>
                                    <div className="file-actions">
                                        <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            onClick={() => setIsResumeModalOpen(true)}
                                            disabled={isSubmitting}
                                        >
                                            <Eye size={18} style={{ marginRight: '5px' }} /> View
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-danger" 
                                            onClick={handleRemoveResume}
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 size={18} style={{ marginRight: '5px' }} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-file-status status-info">
                                     <FileQuestion size={36} color="#9d501d" />
                                    <p>No resume uploaded.</p>
                                </div>
                            )}
                            
                            <p className="file-hint">Max file size 5MB. PDF and DOCX formats preferred.</p>
                            
                            <label htmlFor="resumeFileUpload" className="btn-primary" style={{ width: '100%', marginTop: '10px', display: 'block', textAlign: 'center' }}>
                                <Upload size={18} style={{ marginRight: '8px' }} />
                                {profileData.resumeURL ? 'Replace File' : 'Upload Resume'}
                                <input
                                    type="file"
                                    id="resumeFileUpload"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeFileChange}
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                />
                            </label>
                        </section>

                        {/* --- Bento Card 3: Skills Management --- */}
                        <section className="profile-card section-skills">
                            <SectionTitle icon={Wrench} title="Key Skills" />
                            <div className="skill-tags">
                                {profileData.skills.length > 0 ? (
                                    profileData.skills.map((skill, index) => (
                                        <div className="skill-badge" key={index}>
                                            {skill}
                                            <span 
                                                className="remove-skill" 
                                                onClick={() => !isSubmitting && removeSkill(skill)}
                                            >
                                                <X size={14} />
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="file-hint">Add skills like "React," "Python," or "Project Management."</p>
                                )}
                            </div>
                            <div className="skill-input-bar">
                                <input 
                                    type="text" 
                                    placeholder="Add a new skill (press Enter or Add)" 
                                    name="newSkillInput"
                                    value={profileData.newSkillInput}
                                    onChange={handleFieldChange}
                                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                    disabled={isSubmitting}
                                />
                                <button type="button" onClick={addSkill} className="btn-primary add-skill-btn" disabled={isSubmitting}>
                                    <Plus size={18} />
                                    Add
                                </button>
                            </div>
                        </section>

                        {/* --- Bento Card 4: Education History (Moved to sidebar per existing structure) --- */}
                        <section className="profile-card section-education">
                            <SectionTitle icon={GraduationCap} title="Education History" />
                            <div className="education-grid-wrapper">
                                {profileData.education.map((edu, index) => (
                                    <EducationItem 
                                        key={index}
                                        index={index}
                                        edu={edu}
                                        onChange={handleEducationChange}
                                        onRemove={removeEducationField}
                                    />
                                ))}
                            </div>
                            <button type="button" onClick={addEducationField} className="btn-secondary add-education-btn" disabled={isSubmitting}>
                                <Plus size={16} style={{ marginRight: '8px' }} />
                                Add Education
                            </button>
                        </section>

                        {/* --- Bento Card 5: Account Actions --- */}
                        <section className="profile-card section-account-actions">
                            <SectionTitle icon={Users} title="Account Management" />
                            <button 
                                className="btn-danger logout-btn" 
                                onClick={handleLogout} 
                                disabled={isSubmitting}
                                type="button"
                            >
                                <LogOut size={18} style={{ marginRight: '8px' }} />
                                Log Out
                            </button>
                        </section>

                    </aside> 
                </div>
            </form>
            
            {/* BOTTOM NAVIGATION BAR */}
            <InternNav /> 
            
            {/* Resume Modal Implementation (Placeholder for clean code) */}
            <ResumeModal 
                isOpen={isResumeModalOpen} 
                onClose={() => setIsResumeModalOpen(false)} 
                resumeURL={profileData.resumeURL} 
            />
        </div>
    );
}

// Minimal ResumeModal definition for completeness
const ResumeModal = ({ isOpen, onClose, resumeURL }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}><X /></button>
                <h2 className="modal-title">View Resume</h2>
                <p className="modal-hint">Viewing is not supported natively. Open in a new tab to see the PDF/DOCX.</p>
                <div className="resume-viewer-placeholder">
                    <p>Resume Viewer Placeholder</p>
                    <a 
                        href={resumeURL} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-primary" 
                        style={{ marginTop: '15px' }}
                    >
                        <Eye size={18} style={{ marginRight: '5px' }} />
                        Open in New Tab (Direct Link)
                    </a>
                </div>
            </div>
        </div>
    );
};