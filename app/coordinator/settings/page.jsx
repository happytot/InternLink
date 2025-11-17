"use client";

import React, { useState } from "react";
import CoordinatorSidebar from "../../components/CoordinatorSidebar"; // ✅ your existing sidebar
import "./settings.css";
import { supabase } from "../../../lib/supabaseClient";

export default function CoordinatorSettings() {
  const [activeTab, setActiveTab] = useState("general");

  // Example state (replace with Supabase data)
  const [portalTitle, setPortalTitle] = useState("InternLink Coordinator Portal");
  const [profileData, setProfileData] = useState({
    imageUrl: "https://placehold.co/128x128/4f46e5/ffffff?text=C",
    fullName: "Alex Johnson",
    jobTitle: "Program Director",
    bio: "Dedicated to building strong internship connections and supporting our students.",
  });

  const handleGeneralSave = async () => {
    console.log("Saving General Settings:", portalTitle);
    alert("General settings saved!");
  };

  const handleProfileSave = async () => {
    console.log("Saving Profile:", profileData);
    alert("Profile saved!");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { data, error } = await supabase.storage
      .from("profile_photos")
      .upload(`public/${file.name}`, file, { upsert: true });

    if (error) {
      console.error(error);
      alert("Upload failed!");
    } else {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile_photos/public/${file.name}`;
      setProfileData({ ...profileData, imageUrl: url });
    }
  };

  return (
    <div className="coordinator-settings-layout">
      {/* Sidebar */}
      <CoordinatorSidebar />

      {/* Main Settings Container */}
      <div className="settings-container">
        <h1 className="settings-title">Coordinator Settings</h1>

        {/* Tabs */}
        <div className="tab-buttons">
          <button
            className={activeTab === "general" ? "active" : ""}
            onClick={() => setActiveTab("general")}
          >
            ⚙️ General Settings
          </button>
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            👤 Coordinator Profile
          </button>
        </div>

        {/* Content */}
        <div className="settings-card">
          {activeTab === "general" && (
            <>
              <h2>General Website Configuration</h2>
              <div className="form-group">
                <label>Portal Title</label>
                <input
                  type="text"
                  value={portalTitle}
                  onChange={(e) => setPortalTitle(e.target.value)}
                />
                <small>The main title displayed across the administrative portal.</small>
              </div>
              <button className="save-btn" onClick={handleGeneralSave}>
                Save General Settings
              </button>
            </>
          )}

          {activeTab === "profile" && (
            <>
              <h2>Coordinator Profile Details</h2>
              <div className="profile-section">
                <h4>Profile Photo</h4>
                <img src={profileData.imageUrl} alt="Profile" className="profile-pic" />
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  value={profileData.imageUrl}
                  onChange={(e) =>
                    setProfileData({ ...profileData, imageUrl: e.target.value })
                  }
                />
                <small>Link to a public image (e.g., from Supabase or hosting site).</small>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullName: e.target.value })
                  }
                />
                <small>Your name displayed on contact and welcome pages.</small>
              </div>

              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={profileData.jobTitle}
                  onChange={(e) =>
                    setProfileData({ ...profileData, jobTitle: e.target.value })
                  }
                />
                <small>Your official role within the InternLink program.</small>
              </div>

              <div className="form-group">
                <label>Short Bio/Statement</label>
                <textarea
                  rows="3"
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                />
                <small>This text may be publicly visible to interns.</small>
              </div>

              <button className="save-btn" onClick={handleProfileSave}>
                Save Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
