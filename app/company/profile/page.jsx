'use client';
import './profile.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Building2, LogOut, Upload, MapPin, FileText, Globe,User } from 'lucide-react';
import { toast } from 'sonner';


export default function CompanyProfile() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true); 
  const [uploading, setUploading] = useState(false);
const [profile, setProfile] = useState({
  name: '',
  ceo: '',
  description: '',
  location: '',
  logo_url: '',
  email: '',
  phone: '',
});



  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/db8ee6vbj/image/upload`;
  const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; 

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/companyAuthPage');
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(error);
        toast.error("Error loading profile");
      } 
      else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET') {
      toast.error('Cloudinary UPLOAD_PRESET is not set.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setProfile(prev => ({ ...prev, logo_url: data.secure_url }));
        toast.success('Logo uploaded successfully!'); 
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const savingToast = toast.loading("Saving changes...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
       toast.dismiss(savingToast);
       toast.error('Session expired. Please log in again.');
       return;
    }

    const updates = { id: user.id, ...profile, updated_at: new Date() };

    const { error } = await supabase.from('companies').upsert(updates);
    
    toast.dismiss(savingToast);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out: ' + error.message);
    } else {
      toast.success('Logged out successfully!');
      router.push('/auth/companyAuthPage');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="profile-container">
        {/* Skeleton Header */}
        <div className="bento-header skeleton-pulse">
          <div className="header-left" style={{ width: '100%' }}>
            <div className="skeleton-box" style={{ width: 48, height: 48, borderRadius: 12 }}></div>
            <div style={{ marginLeft: 16 }}>
              <div className="skeleton-box" style={{ width: 200, height: 28, marginBottom: 8 }}></div>
              <div className="skeleton-box" style={{ width: 300, height: 16 }}></div>
            </div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="profile-grid">
          {/* Left Card Skeleton */}
          <div className="bento-card skeleton-pulse" style={{ height: 400 }}>
            <div className="skeleton-box" style={{ width: '100%', height: 30, marginBottom: 30 }}></div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div className="skeleton-box" style={{ width: 140, height: 140, borderRadius: '50%' }}></div>
            </div>
            <div className="skeleton-box" style={{ width: '100%', height: 40, marginTop: 20 }}></div>
          </div>

          {/* Right Card Skeleton */}
          <div className="bento-card skeleton-pulse" style={{ height: 400 }}>
            <div className="skeleton-box" style={{ width: '100%', height: 30, marginBottom: 30 }}></div>
            <div className="skeleton-box" style={{ width: '100%', height: 50, marginBottom: 20 }}></div>
            <div className="skeleton-box" style={{ width: '100%', height: 150, marginBottom: 20 }}></div>
            <div className="skeleton-box" style={{ width: 120, height: 40, marginLeft: 'auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* --- Bento Header --- */}
      <div className="bento-header">
        <div className="header-left">
          <div className="header-icon-box">
            <Building2 size={24} strokeWidth={2.5} />
          </div>
          <div className="header-info">
            <h1>Company Profile</h1>
            <p>Manage your company branding and details.</p>
          </div>
        </div>
        
        {/* 🛠️ FIX: Renamed class to prevent conflict with Sidebar */}
        <button className="profile-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* --- Profile Form Grid --- */}
      <form className="profile-grid" onSubmit={handleSubmit}>
        
        {/* Identity Card */}
        <div className="bento-card identity-card">
          <div className="card-header">
            <h3>Identity</h3>
          </div>
          
          <div className="logo-wrapper">
            <div className="logo-preview">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Company Logo" />
              ) : (
                <div className="placeholder-logo"><Building2 size={40}/></div>
              )}
              {uploading && <div className="upload-overlay">...</div>}
            </div>
            
            <label htmlFor="file-upload" className="upload-label">
              <Upload size={16} />
              <span>{uploading ? 'Uploading...' : 'Change Logo'}</span>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-group">
            <label><Globe size={14} /> Company Name</label>
            <input 
              type="text" 
              name="name" 
              value={profile.name || ''} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Acme Corp"
            />
          </div>
          
<div className="form-group">
  <label><User size={14} /> CEO Name</label>
  <input 
    type="text"
    name="ceo"
    value={profile.ceo || ''}
    onChange={handleChange}
    placeholder="e.g. John Smith"
  />
</div>


        </div>

        {/* Details Card */}
        <div className="bento-card details-card">
          <div className="card-header">
            <h3>Details</h3>
          </div>
<div className="form-group">
  <label><Globe size={14} /> Company Email</label>
  <input 
    type="email"
    name="email"
    value={profile.email || ''}
    onChange={handleChange}
    placeholder="e.g. hr@acmecorp.com"
  />
</div>

<div className="form-group">
  <label><MapPin size={14} /> Phone Number</label>
  <input 
    type="text"
    name="phone"
    value={profile.phone || ''}
    onChange={handleChange}
    placeholder="e.g. +63 912 345 6789"
  />
</div>

          <div className="form-group">
            <label><MapPin size={14} /> Location</label>
            <input 
              type="text" 
              name="location" 
              value={profile.location || ''} 
              onChange={handleChange} 
              placeholder="City, Country" 
            />
          </div>

          <div className="form-group">
            <label><FileText size={14} /> Description</label>
            <textarea
              name="description"
              rows="6"
              value={profile.description || ''}
              onChange={handleChange}
              placeholder="Tell applicants about your company culture and mission..."
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={uploading}>
              Save Changes
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}