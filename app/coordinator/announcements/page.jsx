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
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    getUser();
    fetchAnnouncements();
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
      .from("announcement_images")  // MUST match your bucket name
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
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
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
  };

  return (
    <div className="coordinator-page">
      <CoordinatorSidebar />

      <div className="announcement-page">
        <div className="announcement-header">
          <h1>Announcements</h1>
        </div>

        <div className="announcement-content">
          {/* LEFT LIST */}
          <div className="latest-updates">
            <h2>Latest Updates</h2>

            {announcements.length === 0 ? (
              <p className="no-announcement">No announcements yet.</p>
            ) : (
              <div className="announcement-list">
                {announcements.map((a) => (
                  <div key={a.id} className="announcement-item">
                    {a.image_url && (
                      <img src={a.image_url} className="announcement-img" />
                    )}
                    <h3>{a.title}</h3>
                    <p>{a.content}</p>
                    <span className="date">
                      {new Date(a.created_at).toLocaleString()}
                    </span>

                    <div className="announcement-actions">
                      <button onClick={() => editAnnouncement(a)}>Edit</button>
                      <button
                        className="delete-btn"
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
          <div className="create-announcement">
            <h2>{editingId ? "Edit Announcement" : "Create Announcement"}</h2>

            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
            />

            <label>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write announcement details..."
            />

            <label>Upload Image</label>
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />

            <button onClick={postAnnouncement} disabled={uploading}>
              {uploading
                ? "Uploading..."
                : editingId
                ? "Update Announcement"
                : "Post Announcement"}
            </button>

            {editingId && (
              <button className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
