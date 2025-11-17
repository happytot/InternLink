"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./announcements.css";

export default function CoordinatorAnnouncements() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null); // For edit mode

  useEffect(() => {
    getUser();
    fetchAnnouncements();
  }, []);

  // Get current user ID
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching announcements:", error);
    else setAnnouncements(data);
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("announcement_images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("announcement_images")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Image upload failed:", err.message);
      alert("Failed to upload image.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Post or update announcement
  const postAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image);
      if (!imageUrl && editingId === null) return; // stop if upload failed during new post
    }

    if (editingId) {
      // Update existing announcement
      const { error } = await supabase
        .from("announcements")
        .update({ title, content, image_url: imageUrl })
        .eq("id", editingId);

      if (error) {
        console.error("Error updating announcement:", error);
        alert("Error updating announcement.");
      } else {
        resetForm();
        fetchAnnouncements();
      }
    } else {
      // Insert new announcement
      const { error } = await supabase.from("announcements").insert([
        {
          title,
          content,
          image_url: imageUrl,
          created_by: userId,
        },
      ]);

      if (error) {
        console.error("Error posting announcement:", error);
        alert("Error posting announcement.");
      } else {
        resetForm();
        fetchAnnouncements();
      }
    }
  };

  // Delete announcement
  const deleteAnnouncement = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement.");
    } else {
      fetchAnnouncements();
    }
  };

  // Edit announcement
  const editAnnouncement = (announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setImage(null); // optionally reset image for new upload
  };

  // Reset form after posting/updating
  const resetForm = () => {
    setTitle("");
    setContent("");
    setImage(null);
    setEditingId(null);
  };

  return (
    <div className="coordinator-page">
      <CoordinatorSidebar />

      <div className="announcement-page">
        {/* Header */}
        <div className="announcement-header">
          <h1>Announcements</h1>
        </div>

        <div className="announcement-content">
          {/* Left side - Latest Updates */}
          <div className="latest-updates">
            <h2>Latest Updates</h2>
            {announcements.length === 0 ? (
              <p className="no-announcement">No announcements yet.</p>
            ) : (
              <div className="announcement-list">
                {announcements.map((a) => (
                  <div key={a.id} className="announcement-item">
                    {a.image_url && (
                      <img src={a.image_url} alt="Announcement" className="announcement-img" />
                    )}
                    <h3>{a.title}</h3>
                    <p>{a.content}</p>
                    <span className="date">{new Date(a.created_at).toLocaleString()}</span>
                    <div className="announcement-actions">
  <button onClick={() => editAnnouncement(a)}>Edit</button>
  <button className="delete-btn" onClick={() => deleteAnnouncement(a.id)}>Delete</button>
</div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Create / Edit Announcement */}
          <div className="create-announcement">
            <h2>{editingId ? "Edit Announcement" : "Create New Announcement"}</h2>

            <label>Title</label>
            <input
              type="text"
              placeholder="Enter a concise title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label>Content</label>
            <textarea
              placeholder="Write the full details of the announcement here."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>

            <label>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <button onClick={postAnnouncement} disabled={uploading}>
              {uploading ? "Uploading..." : editingId ? "Update Announcement" : "Post Announcement"}
            </button>

            {editingId && (
              <button onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
