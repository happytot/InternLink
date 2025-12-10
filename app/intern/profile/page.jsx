'use client';

import './Profile.css'; // Importing the adapted CSS
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner'; // Use toast logic only
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FloatingAIChatWithCharts from '../../components/chatbot';

import { 
    User, Users, Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench, Plus, X, 
    FileText, Upload, Eye, Trash2, LogOut, Save, Loader2, MinusCircle, Check, Undo2
} from 'lucide-react';

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
    location: '' 
};

// ========================================
// 🛠️ HELPER COMPONENTS
// ========================================

const SectionTitle = ({ icon: Icon, title }) => (
    <h2 className="section-title">
        <Icon size={24} className="section-icon" />
        {title}
    </h2>
);

const EducationItem = ({ index, edu, onChange, onRemove }) => (
    <div className="education-item-grid" key={index}>
        <div className="edu-input-group">
            <input 
                type="text" 
                placeholder="Institution Name" 
                name="institution"
                value={edu.institution}
                onChange={(e) => onChange(index, e)}
                className="input-base"
            />
            <input 
                type="text" 
                placeholder="Degree / Field of Study" 
                name="degree"
                value={edu.degree}
                onChange={(e) => onChange(index, e)}
                className="input-base"
            />
            <input 
                type="text" 
                placeholder="Years (e.g., 2018-2022)" 
                name="years"
                value={edu.years}
                onChange={(e) => onChange(index, e)}
                className="input-base"
            />
        </div>
        {index >= 0 && (
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
             <div className="page-title-skeleton skeleton-pulse"></div>
             <div className="profile-bento-grid">
                <div className="profile-card skeleton-card skeleton-pulse"></div>
                <div className="profile-card skeleton-card skeleton-pulse"></div>
                <div className="profile-card skeleton-card skeleton-pulse"></div>
             </div>
        </div>
    </div>
);

// ========================================
// 🎯 MAIN PROFILE COMPONENT
// ========================================
export default function Profile() {
    const supabase = createClientComponentClient();
    const router = useRouter();

    // --- State ---
    const [profileData, setProfileData] = useState(INITIAL_STATE);
    const [originalData, setOriginalData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    // --- Visibility Logic States ---
    const [isScrolling, setIsScrolling] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setLoading(false);
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

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    const savedDept = data.department || '';
                    const isStandard = STANDARD_DEPARTMENTS.includes(savedDept);
                    
                    const loadedData = {
                        fullName: data.fullname || '',
                        email: user.email || '',
                        phone: data.phone || '',
                        location: data.location || '',
                        summary: data.summary || '',
                        education: data.education ?? [{ institution: '', degree: '', years: '' }],
                        skills: data.skills || [],
                        profilePicURL: data.profile_pic_url || '',
                        resumeURL: data.resume_url || '',
                        resumeFileName: data.resume_file_name || '',
                        department: isStandard ? savedDept : (savedDept ? 'Other' : ''),
                        customDepartment: isStandard ? '' : savedDept,
                        newSkillInput: ''
                    };
                    setProfileData(loadedData);
                    setOriginalData(loadedData);
                } else {
                    const initialUser = { ...INITIAL_STATE, email: user.email };
                    setProfileData(initialUser);
                    setOriginalData(initialUser);
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

    // --- Scroll Detection ---
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolling(true);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    // --- Typing Detection ---
    const triggerTyping = () => {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 800);
    };

    // --- Dirty Check ---
    const hasChanges = useMemo(() => {
        const cleanProfile = { ...profileData, newSkillInput: '' };
        const cleanOriginal = { ...originalData, newSkillInput: '' };
        return JSON.stringify(cleanProfile) !== JSON.stringify(cleanOriginal);
    }, [profileData, originalData]);

    // --- Handlers ---
    const handleFieldChange = (e) => {
        triggerTyping();
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleEducationChange = (index, e) => {
        triggerTyping();
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

    // LOGOUT
    const handleLogout = async () => {
        const logoutToast = toast.loading('Logging out...');
        try {
            await supabase.auth.signOut();
            toast.dismiss(logoutToast);
            router.push('/auth/internAuthPage');
        } catch (error) {
            toast.error('Error logging out.', { id: logoutToast });
        }
    };

    // CANCEL
    const handleCancel = () => {
        if (window.confirm("Discard all unsaved changes?")) {
            setProfileData(originalData);
            toast.info("Changes discarded.");
        }
    };

    // FILES
    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!userId) {
            toast.error("User session not found. Please refresh.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size should be less than 2MB.");
            return;
        }

        const uploadToast = toast.loading('Uploading picture...');

        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const newUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

            setProfileData(prev => ({ ...prev, profilePicURL: newUrl }));
            toast.success("Profile picture updated!", { id: uploadToast });

        } catch (error) {
            console.error('Upload Error:', error);
            toast.error(`Upload failed: ${error.message}`, { id: uploadToast });
        }
    };

    const handleResumeFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) return;

        const uploadToast = toast.loading('Uploading resume...');
        const filePath = `${userId}/${file.name}`;
        try {
            await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
            const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath);

            setProfileData(prev => ({
                ...prev,
                resumeURL: urlData.publicUrl,
                resumeFileName: file.name
            }));
            toast.dismiss(uploadToast);
        } catch (error) {
            toast.error("Upload failed", { id: uploadToast });
        }
    };

    const handleRemoveResume = () => {
        if (window.confirm("Remove your uploaded resume?")) {
            setProfileData(prev => ({ ...prev, resumeURL: '', resumeFileName: '' }));
        }
    };

    // SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) return;

        setIsSubmitting(true);
        
        const finalDepartment = profileData.department === 'Other' 
            ? profileData.customDepartment 
            : profileData.department;

        const cleanEducation = profileData.education.filter(edu => edu.institution || edu.degree || edu.years);
        
        const dataToSave = {
            fullname: profileData.fullName,
            phone: profileData.phone,
            summary: profileData.summary,
            department: finalDepartment,
            location: profileData.location,
            education: cleanEducation,
            skills: profileData.skills,
            profile_pic_url: profileData.profilePicURL,
            resume_url: profileData.resumeURL,
            resume_file_name: profileData.resumeFileName,
            updated_at: new Date().toISOString(),
        };

        try {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (existingProfile) {
                await supabase.from('profiles').update(dataToSave).eq('id', userId);
            } else {
                await supabase.from('profiles').insert([{ id: userId, ...dataToSave }]);
            }

            setSaveSuccess(true);
            setIsSubmitting(false);
            
            const cleanedProfileState = { 
                ...profileData, 
                education: cleanEducation,
                department: finalDepartment 
            };

            try {
                fetch(`/api/embedding/intern`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ intern_id: userId })
                });
            } catch (e) { console.error("Embedding error", e); }

            setTimeout(() => {
                setProfileData(cleanedProfileState);
                setOriginalData(cleanedProfileState);
                setSaveSuccess(false); 
            }, 1500);

        } catch (err) {
            console.error("Error saving:", err);
            setIsSubmitting(false);
            toast.error(`Failed to save: ${err.message}`);
        }
    };

    if (loading) return <SkeletonCard />;

    const showSaveBar = (hasChanges && !isScrolling && !isTyping) || saveSuccess;

    return (
        <div className="profile-wrapper">
            
            <form onSubmit={handleSubmit}>
                
                {/* FLOATING SAVE TOAST */}
                <div className={`floating-save-toast ${showSaveBar ? 'visible' : ''}`}>
                    <div className="toast-content">
                        {saveSuccess ? (
                            <span className="toast-message success-text">
                                <Check size={18} /> Changes Saved!
                            </span>
                        ) : (
                            <span className="toast-message">
                                You have unsaved changes
                            </span>
                        )}
                        
                        <div className="toast-actions">
                            {!saveSuccess && (
                                <button 
                                    type="button" 
                                    onClick={handleCancel}
                                    className="btn-toast-cancel"
                                    disabled={isSubmitting}
                                >
                                    <Undo2 size={16} /> Cancel
                                </button>
                            )}
                            
                            <button 
                                type="submit" 
                                className={`btn-toast-save ${saveSuccess ? 'btn-success-state' : ''}`}
                                disabled={isSubmitting || saveSuccess}
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="spin-icon" />
                                ) : saveSuccess ? (
                                    <Check size={16} />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saveSuccess ? "Profile Saved!" : (isSubmitting ? "Saving..." : "Save Changes")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="profile-content-area">
                    <div className="page-header-row">
                         <h1 className="page-title">
                            <Users size={32} className="page-title-icon" />
                            My Profile
                        </h1>
                        <button 
                            type="button"
                            className="btn-danger-outline"
                            onClick={handleLogout}
                            disabled={isSubmitting}
                        >
                            <LogOut size={16} className="logout-icon-spacing" /> Log Out
                        </button>
                    </div>

                    {/* 3-COLUMN BENTO GRID */}
                    <div className="profile-bento-grid">
                        
                        {/* COLUMN 1: PERSONAL INFO (Left) */}
                        <div className="bento-col col-left">
                            <section className="profile-card section-personal-info h-full">
                                <div className="profile-pic-wrapper">
                                    <div className="profile-pic-container">
                                        {profileData.profilePicURL ? (
                                            <img src={profileData.profilePicURL} alt="Profile" className="profile-avatar" />
                                        ) : (
                                            <div className="profile-avatar placeholder-avatar">👤</div>
                                        )}
                                    </div>
                                    <label htmlFor="profilePicUpload" className="btn-icon-upload" title="Upload Photo">
                                        <Upload size={16} />
                                        <input type="file" id="profilePicUpload" accept="image/*" onChange={handleProfilePicChange} className="visually-hidden" disabled={isSubmitting} />
                                    </label>
                                </div>

                                <div className="personal-details-stack">
                                    <div className="form-group">
                                        <label htmlFor="fullName"><User size={16} /> Full Name</label>
                                        <input className="input-base" type="text" id="fullName" name="fullName" placeholder="John Doe" value={profileData.fullName} onChange={handleFieldChange} disabled={isSubmitting} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email"><Mail size={16} /> Email</label>
                                        <input className="input-base input-disabled" type="email" value={profileData.email} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phone"><Phone size={16} /> Phone</label>
                                        <input className="input-base" type="tel" name="phone" placeholder="(+63)" value={profileData.phone} onChange={handleFieldChange} disabled={isSubmitting} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="location"><MapPin size={16} /> Location</label>
                                        <input className="input-base" type="text" name="location" placeholder="City" value={profileData.location} onChange={handleFieldChange} disabled={isSubmitting} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="department"><Briefcase size={16} /> Department</label>
                                        <select className="input-base" name="department" value={profileData.department} onChange={handleFieldChange} disabled={isSubmitting}>
                                            <option value="" disabled>Select</option>
                                            {STANDARD_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    {profileData.department === 'Other' && (
                                        <div className="form-group">
                                            <input className="input-base" type="text" name="customDepartment" placeholder="Specify Dept" value={profileData.customDepartment} onChange={handleFieldChange} disabled={isSubmitting} />
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* COLUMN 2: SUMMARY & EDUCATION (Center) */}
                        <div className="bento-col col-center">
                             {/* Summary */}
                             <section className="profile-card section-summary">
                                <SectionTitle icon={Briefcase} title="Professional Summary" />
                                <textarea name="summary" className="input-base summary-textarea" placeholder="Describe your professional background..." value={profileData.summary} onChange={handleFieldChange} disabled={isSubmitting}></textarea>
                            </section>

                            {/* Education (Scrollable) */}
                            <section className="profile-card section-education flex-grow-card">
                                <div className="card-header-flex">
                                    <SectionTitle icon={GraduationCap} title="Education" />
                                    <button type="button" onClick={addEducationField} className="btn-sm-primary" disabled={isSubmitting}><Plus size={16} /> Add</button>
                                </div>
                                
                                <div className="scrollable-content-area education-scroll">
                                    <div className="education-list">
                                        {profileData.education.map((edu, index) => (
                                            <EducationItem key={index} index={index} edu={edu} onChange={handleEducationChange} onRemove={removeEducationField} />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* COLUMN 3: RESUME & SKILLS (Right) */}
                        <div className="bento-col col-right">
                             {/* Resume */}
                             <section className="profile-card section-resume">
                                <SectionTitle icon={FileText} title="Resume" />
                                {profileData.resumeURL ? (
                                    <div className="uploaded-file-mini">
                                        <div className="file-info-mini">
                                            <FileText size={20} className="text-primary" />
                                            <span className="truncate-text" title={profileData.resumeFileName}>{profileData.resumeFileName || "Resume.pdf"}</span>
                                        </div>
                                        <div className="file-actions-mini">
                                            <button type="button" className="btn-icon-mini" onClick={() => setIsResumeModalOpen(true)}><Eye size={16} /></button>
                                            <button type="button" className="btn-icon-mini danger" onClick={handleRemoveResume}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-file-mini">
                                        <span className="text-sm text-muted">No resume uploaded</span>
                                    </div>
                                )}
                                <label htmlFor="resumeFileUpload" className="btn-secondary full-width-btn mt-2">
                                    <Upload size={16} className="mr-2" /> {profileData.resumeURL ? 'Replace' : 'Upload PDF'}
                                    <input type="file" id="resumeFileUpload" accept=".pdf,.doc,.docx" onChange={handleResumeFileChange} className="visually-hidden" disabled={isSubmitting} />
                                </label>
                            </section>

                            {/* Skills (Scrollable) */}
                            <section className="profile-card section-skills flex-grow-card">
                                <SectionTitle icon={Wrench} title="Key Skills" />
                                <div className="skill-input-group">
                                    <input className="input-base" type="text" placeholder="Add skill..." name="newSkillInput" value={profileData.newSkillInput} onChange={handleFieldChange} onKeyDown={(e) => e.key === 'Enter' && addSkill()} disabled={isSubmitting} />
                                    <button type="button" onClick={addSkill} className="btn-primary-icon" disabled={isSubmitting}><Plus size={18} /></button>
                                </div>
                                
                                <div className="scrollable-content-area skills-scroll">
                                    <div className="skill-tags">
                                        {profileData.skills.map((skill, index) => (
                                            <div className="skill-badge" key={index}>
                                                {skill}
                                                <span className="remove-skill" onClick={() => !isSubmitting && removeSkill(skill)}><X size={14} /></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>

                    </div>
                </div>
            </form>
            <FloatingAIChatWithCharts studentId={userId} />

            {/* Resume Modal */}
          {isResumeModalOpen && selectedApplicant && (
  <div className="modal-backdrop" onClick={() => setIsResumeModalOpen(false)}>
    <div className="modal-profile-container" onClick={(e) => e.stopPropagation()}>

      {/* Close Button */}
      <button className="modal-close-btn" onClick={() => setIsResumeModalOpen(false)}>
        <X />
      </button>

      {/* HEADER */}
      <div className="profile-header">
        <img 
          src={selectedApplicant.profiles?.avatar_url || "/default-avatar.png"} 
          alt="Profile" 
          className="profile-photo"
        />

        <div className="profile-header-info">
          <h2>{selectedApplicant.profiles?.fullname}</h2>
          <p className="profile-subtext">{selectedApplicant.job_posts?.title}</p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="profile-grid">

        {/* LEFT COLUMN */}
        <div className="profile-left">
          <div className="profile-card">
            <h3>Contact</h3>
            <div className="contact-item"><Mail size={16}/> {selectedApplicant.profiles?.email}</div>
            <div className="contact-item"><Phone size={16}/> {selectedApplicant.profiles?.phone || "No phone added"}</div>
          </div>

          <div className="profile-card">
            <h3>Skills</h3>
            <div className="skills-container">
              {(selectedApplicant.profiles?.skills || "No skills added")
                .toString()
                .split(',')
                .map((skill, index) => (
                <span key={index} className="skill-tag">{skill.trim()}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-right">
          <div className="profile-card">
            <h3>Education</h3>
            {selectedApplicant.profiles?.education?.length > 0 ? (
              selectedApplicant.profiles.education.map((edu, i) => (
                <div key={i} className="education-item">
                  <strong>{edu.school}</strong>
                  <span>{edu.degree} — {edu.year}</span>
                </div>
              ))
            ) : (
              <p className="text-muted">No education data provided.</p>
            )}
          </div>

          <div className="profile-card">
            <h3>Resume</h3>
            <a 
              href={selectedApplicant.resume_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary"
            >
              <Eye size={18} /> View Resume (PDF)
            </a>
          </div>
        </div>

      </div>

    </div>
  </div>
)}

        </div>
    );
}