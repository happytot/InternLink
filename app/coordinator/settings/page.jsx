"use client";

import React, { useState, useEffect } from "react";
import "./settings.css";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  User, 
  Lock, 
  Settings as SettingsIcon, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Sun, 
  Moon
} from "lucide-react";

// Font imports (Keep these if not in your root layout, otherwise remove)
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

export default function CoordinatorSettings() {
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profileData, setProfileData] = useState({
    imageUrl: "", // Will be filled from DB
    fullName: "",
    jobTitle: "",
    bio: "",
  });
  const [originalProfileData, setOriginalProfileData] = useState({});
  const [editMode, setEditMode] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [isLightMode, setIsLightMode] = useState(false);

  // --- Theme Toggle Logic ---
  useEffect(() => {
    // Check initial state
    if (document.body.classList.contains('light-mode')) {
      setIsLightMode(true);
    }
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  // --- Fetch profile data ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile) {
          const filledProfile = {
            fullName: profile.fullname || "",
            jobTitle: profile.job_title || "",
            bio: profile.summary || "",
            imageUrl: profile.profile_pic_url || "https://placehold.co/128x128/EE7428/021217?text=C",
          };
          setProfileData(filledProfile);
          setOriginalProfileData(filledProfile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- Handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User ID is missing.");

      const { error } = await supabase
        .from("profiles")
        .update({
          fullname: profileData.fullName,
          job_title: profileData.jobTitle,
          summary: profileData.bio,
          profile_pic_url: profileData.imageUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      console.log("Profile updated successfully!");
      setOriginalProfileData(profileData);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSecuritySave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.error("New passwords do not match!");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      console.log("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `profile-${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("profile_photos")
      .upload(fileName, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from("profile_photos")
      .getPublicUrl(fileName);

    if (urlError) {
      console.error(urlError);
      return;
    }

    setProfileData({ ...profileData, imageUrl: publicUrl });
  };

  // --- Tabs ---
  const ProfileTab = () => (
    <div className="tab-content-wrapper">
      <h2 className="section-title">
        <User size={24} className="icon-orange" /> Profile Details
      </h2>

      {loading ? (
        <div className="profile-skeleton">
          Loading...
        </div>
      ) : (
        <div className="profile-section">
          <div className="profile-photo-container">
            <img src={profileData.imageUrl} alt="Profile" className="profile-pic" />
            {editMode && (
              <label className="upload-btn-label">
                <Camera size={16} /> Upload New Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: "none" }} 
                />
              </label>
            )}
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={profileData.fullName}
              onChange={handleProfileChange}
              disabled={!editMode}
              autoComplete="off"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label>Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={profileData.jobTitle}
              onChange={handleProfileChange}
              disabled={!editMode}
              autoComplete="off"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label>Short Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              rows={3}
              disabled={!editMode}
              className="settings-textarea"
            />
          </div>

          <div className="button-group">
            {!editMode ? (
                <button className="btn-primary" onClick={() => setEditMode(true)}>
                <Edit3 size={18} /> Edit Profile
                </button>
            ) : (
                <>
                <button className="btn-primary" onClick={handleProfileSave}>
                    <Save size={18} /> Save
                </button>
                <button
                    className="btn-secondary"
                    onClick={() => {
                    setProfileData(originalProfileData);
                    setEditMode(false);
                    }}
                >
                    <X size={18} /> Cancel
                </button>
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const SecurityTab = () => (
    <div className="tab-content-wrapper">
      <h2 className="section-title">
        <Lock size={24} className="icon-orange" /> Change Password
      </h2>
      
      <div className="form-group">
        <label>Current Password</label>
        <input
          type="password"
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
          className="settings-input"
        />
      </div>

      <div className="form-group">
        <label>New Password</label>
        <input
          type="password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
          className="settings-input"
        />
      </div>

      <div className="form-group">
        <label>Confirm New Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
          className="settings-input"
        />
      </div>

      <div className="button-group">
        <button
            className="btn-primary"
            onClick={handleSecuritySave}
            disabled={passwordData.newPassword.length < 8}
        >
            <Save size={18} /> Update Password
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-inner">
      
      {/* Header Section */}
      <div className="settings-header glass-card reveal-on-scroll">
        <div className="header-content">
            <h1 className="settings-title">
                <SettingsIcon size={32} style={{marginRight:'10px', color:'var(--primary-orange)'}} />
                Coordinator Settings
            </h1>
            <p className="settings-subtitle">Manage your profile and account security.</p>
        </div>
        
        {/* Theme Toggle Button (Right Side) */}
        <div className="header-actions">
            <button 
                className="theme-toggle-btn" 
                onClick={() => setIsLightMode(!isLightMode)}
                title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
                {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                <span className="toggle-text">{isLightMode ? "Dark Mode" : "Light Mode"}</span>
            </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="settings-bento-grid">
        
        {/* Navigation Panel */}
        <div className="tab-navigation-panel glass-card reveal-on-scroll" style={{ animationDelay: "0.1s" }}>
          <button
            className={activeTab === "profile" ? "active btn-tab" : "btn-tab"}
            onClick={() => setActiveTab("profile")}
          >
            <User size={18} /> Profile
          </button>
          <button
            className={activeTab === "security" ? "active btn-tab" : "btn-tab"}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={18} /> Security
          </button>
        </div>

        {/* Content Panel */}
        <div className="settings-content-card glass-card reveal-on-scroll" style={{ animationDelay: "0.2s" }}>
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>

      </div>
    </div>
  );
}