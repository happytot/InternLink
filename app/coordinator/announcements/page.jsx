"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./announcements.css"; // The new CSS file

export default function CoordinatorAnnouncements() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    getUser();
    fetchAnnouncements();

    // Optional: Update timeAgo every 30s for live updates
    const interval = setInterval(() => {
      setAnnouncements((prev) => [...prev]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setAnnouncements(data);
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);

      if (!file) {
        alert("No image selected.");
        return null;
      }

      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("announcement_images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("announcement_images")
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const postAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image);
    }

    if (editingId) {
      const { error } = await supabase
        .from("announcements")
        .update({ title, content, image_url: imageUrl })
        .eq("id", editingId);

      if (error) console.error(error);
      else {
        resetForm();
        fetchAnnouncements();
      }
    } else {
      await supabase.from("announcements").insert([
        {
          title,
          content,
          image_url: imageUrl,
          created_by: userId,
        },
      ]);

      resetForm();
      fetchAnnouncements();
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("Delete this announcement?")) return;

    await supabase.from("announcements").delete().eq("id", id);
    fetchAnnouncements();
  };

  const editAnnouncement = (a) => {
    setEditingId(a.id);
    setTitle(a.title);
    setContent(a.content);
    setImage(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
  };

  // --- Utility function for relative time ---
  const timeAgo = (timestamp) => {
    const now = new Date();
    const uploaded = new Date(timestamp);
    const seconds = Math.floor((now - uploaded) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="coordinator-page">
      <CoordinatorSidebar />

      <div className="announcement-page">
        <div className="announcement-header glass-card">
          <h1>Announcement</h1>
        </div>

        <div className="announcement-content">
          {/* LEFT LIST */}
          <div className="latest-updates">
            <h2>Latest Updates</h2>

            {announcements.length === 0 ? (
              <p className="no-announcement">
                No announcements yet. Ready to post the first one?
              </p>
            ) : (
              <div className="announcement-list">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="announcement-item card-hover-effect reveal-on-scroll"
                  >
                    {a.image_url && (
                      <img
                        src={a.image_url}
                        className="announcement-img"
                        alt={a.title}
                      />
                    )}
                    <h3 className="announcement-title">{a.title}</h3>
                    <p className="announcement-text">{a.content}</p>
                    <span className="date">{timeAgo(a.created_at)}</span>

                    <div className="announcement-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => editAnnouncement(a)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteAnnouncement(a.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT FORM */}
          <div className="create-announcement glass-card reveal-on-scroll">
            <h2>
              {editingId ? "✍️ Edit Announcement" : "✨ Create New Announcement"}
            </h2>

            <label htmlFor="title-input">Title</label>
            <input
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Mandatory Orientation on Friday"
            />

            <label htmlFor="content-textarea">Content</label>
            <textarea
              id="content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the detailed announcement here..."
              rows={6}
            />

            <label htmlFor="image-input">Upload Image</label>
            <input
              id="image-input"
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <button
              onClick={postAnnouncement}
              disabled={uploading}
              className="btn-primary"
            >
              {uploading
                ? "Uploading..."
                : editingId
                ? "Update Announcement"
                : "Post Announcement"}
            </button>

            {editingId && (
              <button className="btn-cancel" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
