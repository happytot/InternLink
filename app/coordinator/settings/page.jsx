"use client";

import React, { useState, useEffect } from "react";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./settings.css";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

const initialProfileData = {
  imageUrl: "https://placehold.co/128x128/EE7428/021217?text=C",
  fullName: "N/A",
  jobTitle: "N/A",
  bio: "N/A",
};

export default function CoordinatorSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profileData, setProfileData] = useState(initialProfileData);
  const [originalProfileData, setOriginalProfileData] = useState(initialProfileData);
  const [editMode, setEditMode] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);

  // --- Fetch profile data from database ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await supabase.auth.getUser();
        const userId = userRes.data.user?.id;

        if (!userId) {
          console.error("User not logged in!");
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;

        if (profile) {
          const filledProfile = {
            fullName: profile.fullname || "N/A",
            jobTitle: profile.job_title || "N/A",
            bio: profile.summary || "N/A",
            imageUrl: profile.profile_pic_url || initialProfileData.imageUrl,
          };
          setProfileData(filledProfile);
          setOriginalProfileData(filledProfile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        console.log("Failed to load profile data.");
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
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("User ID is missing.");

      const { error } = await supabase
        .from("profiles")
        .update({
          fullname: profileData.fullName,
          job_title: profileData.jobTitle,
          summary: profileData.bio,
          profile_pic_url: profileData.imageUrl,
        })
        .eq("id", userId);

      if (error) throw error;

      console.log("Profile updated successfully!");
      setOriginalProfileData(profileData);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      console.log("Failed to update profile.");
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
      console.log("Failed to update password. Please ensure your session is active and valid.");
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
      console.log("Failed to upload image.");
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
    <>
      <h2>👤 Profile Details</h2>

      {loading ? (
        <div className="profile-skeleton">
          <div className="skeleton skeleton-circle" style={{ width: 128, height: 128 }} />
          <div className="skeleton skeleton-line" style={{ width: "60%", marginTop: 10 }} />
          <div className="skeleton skeleton-line" style={{ width: "40%", marginTop: 10 }} />
          <div className="skeleton skeleton-textarea" style={{ width: "80%", height: 60, marginTop: 10 }} />
        </div>
      ) : (
        <div className="profile-section">
          <div className="profile-photo-container">
            <img src={profileData.imageUrl} alt="Profile" className="profile-pic" />
            {editMode && (
              <label className="upload-btn-label">
                Upload New Photo
                <input 
                  key="image-upload-input"
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
              key="profile-full-name"
              type="text"
              name="fullName"
              value={profileData.fullName}
              onChange={handleProfileChange}
              disabled={!editMode}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label>Job Title</label>
            <input
              key="profile-job-title"
              type="text"
              name="jobTitle"
              value={profileData.jobTitle}
              onChange={handleProfileChange}
              disabled={!editMode}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label>Short Bio</label>
            <textarea
              key="profile-bio"
              name="bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              rows={3}
              disabled={!editMode}
            />
          </div>

          {!editMode && (
            <button className="btn-primary" onClick={() => setEditMode(true)}>
              ✏️ Edit Profile
            </button>
          )}

          {editMode && (
            <>
              <button className="btn-primary" onClick={handleProfileSave}>
                💾 Save
              </button>
              <button
                className="btn-primary"
                style={{ background: "#475569", marginTop: "10px" }}
                onClick={() => {
                  setProfileData(originalProfileData);
                  setEditMode(false);
                }}
              >
                ❌ Cancel
              </button>
            </>
          )}
        </div>
      )}
    </>
  );

  const SecurityTab = () => (
    <>
      <h2>🔒 Change Password</h2>
      <div className="form-group">
        <label>Current Password</label>
        <input
          key="security-current-password"
          type="password"
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
        />
      </div>

      <div className="form-group">
        <label>New Password</label>
        <input
          key="security-new-password"
          type="password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label>Confirm New Password</label>
        <input
          key="security-confirm-password"
          type="password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
        />
      </div>

      <button
        className="btn-primary"
        onClick={handleSecuritySave}
        disabled={passwordData.newPassword.length < 8}
      >
        Update Password
      </button>
    </>
  );

  return (
    <div className="coordinator-settings-layout">
      <CoordinatorSidebar /> 

      <div className="settings-container">
        <div className="settings-header glass-card reveal-on-scroll">
          <h1 className="settings-title">Coordinator Settings 🛠️</h1>
          <p className="settings-subtitle">Manage your profile and account security.</p>
        </div>

        <div className="settings-bento-grid">
          <div className="tab-navigation-panel glass-card reveal-on-scroll" style={{ animationDelay: "0.1s" }}>
            <button
              className={activeTab === "profile" ? "active btn-tab" : "btn-tab"}
              onClick={() => setActiveTab("profile")}
            >
              👤 Profile
            </button>
            <button
              className={activeTab === "security" ? "active btn-tab" : "btn-tab"}
              onClick={() => setActiveTab("security")}
            >
              🔒 Security
            </button>
          </div>

          <div className="settings-content-card glass-card reveal-on-scroll" style={{ animationDelay: "0.2s" }}>
            {activeTab === "profile" && <ProfileTab key="profile-tab-content" />}
            {activeTab === "security" && <SecurityTab key="security-tab-content" />}
          </div>
        </div>
      </div>
    </div>
  );
}
