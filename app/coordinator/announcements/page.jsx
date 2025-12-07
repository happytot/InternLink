"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast, Toaster } from 'sonner';
// Switched to lucide-react for better compatibility/performance
import { Megaphone, Image as ImageIcon, Send, PenSquare, Trash2, Plus } from 'lucide-react';
import "./announcements.css";

// Font imports (Keep these if not in your root layout, otherwise remove)
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

export default function CoordinatorAnnouncements() {
  const supabase = createClientComponentClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

    // Live updates every 30s
    const interval = setInterval(() => {
      fetchAnnouncements(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async (silent = false) => {
    if (!silent) setLoading(true);
    
    // Select * from announcements
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch error:", error);
        if(!silent) toast.error("Could not load announcements");
    } else {
        setAnnouncements(data || []);
    }
    
    if (!silent) setLoading(false);
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      if (!file) return null;

      const ext = file.name.split(".").pop();
      const fileName = `announcements/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("announcement_images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("announcement_images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Image upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const postAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      return toast.warning("Please fill in both title and content.");
    }

    setUploading(true);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            throw new Error("You must be logged in to post.");
        }

        let imageUrl = null;
        if (image) {
            imageUrl = await uploadImage(image);
        }

        if (editingId) {
            // Update
            const updateData = { title, content };
            if (imageUrl) updateData.image_url = imageUrl;

            const { error } = await supabase
                .from("announcements")
                .update(updateData)
                .eq("id", editingId);

            if (error) throw error;
            toast.success("Announcement updated successfully!");
        } else {
            // Insert
            const { error } = await supabase.from("announcements").insert([
                {
                    title,
                    content,
                    image_url: imageUrl,
                    created_by: user.id,
                },
            ]);

            if (error) throw error;
            toast.success("Announcement posted successfully!");
        }

        resetForm();
        fetchAnnouncements();

    } catch (err) {
        console.error("Post error:", err);
        toast.error(`Failed to post: ${err.message}`);
    } finally {
        setUploading(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("Delete this announcement?")) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error("Failed to delete.");
    else {
        toast.success("Deleted successfully.");
        fetchAnnouncements();
    }
  };

  const editAnnouncement = (a) => {
    setEditingId(a.id);
    setTitle(a.title);
    setContent(a.content);
    setImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
    const fileInput = document.getElementById('file-upload');
    if(fileInput) fileInput.value = '';
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const uploaded = new Date(timestamp);
    const diff = Math.floor((now - uploaded) / 1000);

    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="dashboard-inner">
      {/* Toast Notification Container */}
      <Toaster richColors position="top-center" />

      {/* Header - Removed 'reveal-on-scroll' so it is always visible */}
      <div className="header-section">
        <div className="header-text">
            <h2>Announcements</h2>
            <p className="dash-subtitle">Broadcast updates to all students and companies.</p>
        </div>
        <div className="header-icon">
            <Megaphone size={28} />
        </div>
      </div>

      <div className="announcements-grid">
        
        {/* --- LEFT COLUMN: Feed --- */}
        <div className="feed-column">
            <div className="feed-header">
                <h3>Latest Updates</h3>
                <span className="badge">{announcements.length} Posts</span>
            </div>

            {loading ? (
                <div className="announcement-card" style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>
                    Loading...
                </div>
            ) : announcements.length === 0 ? (
                <div className="empty-state-card announcement-card">
                    <p>No announcements yet. Use the form to post the first one!</p>
                </div>
            ) : (
                <div className="announcement-list">
                    {announcements.map((a) => (
                        <div key={a.id} className="announcement-card reveal-on-scroll">
                            
                            {/* Header */}
                            <div className="post-header">
                                <h3 className="post-title">{a.title}</h3>
                                <span className="post-time">{timeAgo(a.created_at)}</span>
                            </div>

                            {/* Image */}
                            {a.image_url && (
                                <div className="post-image-wrapper">
                                    <img src={a.image_url} alt={a.title} className="post-image" />
                                </div>
                            )}

                            {/* Content */}
                            <p className="post-content">{a.content}</p>

                            {/* Footer Actions */}
                            <div className="post-footer">
                                <span className="author-tag">Posted by Coordinator</span>
                                <div className="action-buttons">
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => editAnnouncement(a)}
                                        title="Edit"
                                    >
                                        <PenSquare size={18} />
                                    </button>
                                    <button 
                                        className="icon-btn delete-btn" 
                                        onClick={() => deleteAnnouncement(a.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- RIGHT COLUMN: Form (Sticky) --- */}
        <div className="form-column">
            <div className="create-card card">
                <div className="form-header">
                    <h3>{editingId ? "✍️ Edit Post" : "✨ Create Post"}</h3>
                </div>

                <div className="form-group">
                    <label>Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="E.g., Mandatory Orientation"
                        className="input-field"
                        disabled={uploading}
                    />
                </div>

                <div className="form-group">
                    <label>Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your announcement..."
                        rows={6}
                        className="textarea-field"
                        disabled={uploading}
                    />
                </div>

                <div className="form-group">
                    <label>Attachment</label>
                    <div className="file-upload-wrapper">
                        <label htmlFor="file-upload" className="custom-file-upload">
                            <ImageIcon size={18} /> {image ? "Image Selected" : "Upload Image"}
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={(e) => setImage(e.target.files[0])}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                        {image && <p style={{fontSize:'12px', color:'#cbd5e1', marginTop:'5px'}}>{image.name}</p>}
                    </div>
                </div>

                <div className="form-actions" style={{display:'flex', gap:'10px'}}>
                    {editingId && (
                        <button className="btn-secondary" onClick={resetForm} disabled={uploading}>
                            Cancel
                        </button>
                    )}
                    <button 
                        className="btn-primary" 
                        onClick={postAnnouncement} 
                        disabled={uploading}
                        style={{width:'100%'}}
                    >
                        {uploading ? "Processing..." : editingId ? "Update Post" : <><Send size={16} /> Post</>}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}