'use client';

// 1. ✅ Added 'useCallback'
import { useEffect, useState, useRef, useCallback } from 'react';

// 2. ⛔️ REMOVED your old supabase import
// import { supabase } from '../../../lib/supabaseClient';

// 3. ✅ ADDED this import instead
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useRouter } from 'next/navigation';
import './profile.css';

export default function CompanyProfile() {
  // 4. ✅ INITIALIZED the client *inside* the component
  const supabase = createClientComponentClient();

  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'
  const router = useRouter();
  
  const toastTimeoutRef = useRef(null);

  // NOTE: You need to set your Cloudinary preset!
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/db8ee6vbj/image/upload`;
  const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; 

  const showToast = (message, type = 'success', callback) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
      if (callback) callback();
    }, 3000);
  };

  // 5. ✅ Wrapped fetchProfile in useCallback
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    
    // This 'supabase' variable is now the cookie-aware one
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please log in to view your profile.');
      router.push('/auth/companyAuthPage'); // Corrected login path
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') console.error(error);
    else if (data) setProfile(data);

    setLoading(false);
  }, [supabase, router]); // 6. ✅ Added supabase and router dependencies

  // 7. ✅ Added fetchProfile to the dependency array
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET') {
      alert('Error: Cloudinary UPLOAD_PRESET is not set in your code.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) setProfile(prev => ({ ...prev, logo_url: data.secure_url }));
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('❌ Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  // This will now work correctly
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
       showToast('❌ Session expired. Please log in again.', 'error');
       setLoading(false);
       return;
    }

    const updates = { id: user.id, ...profile, updated_at: new Date() };

    const { error } = await supabase.from('companies').upsert(updates);
    if (error) showToast('❌ Failed to update profile', 'error');
    else showToast('✅ Profile updated successfully!', 'success');

    setLoading(false);
  };

  // This will also work correctly
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('❌ Error logging out: ' + error.message, 'error');
    } else {
      showToast('Logged out successfully!', 'success', () => {
        router.push('/auth/companyAuthPage');
      });
    }
  };

  return (
    <div className="company-profile-container">
      <div className="profile-header-container">
        <h1 className="profile-header">Company Profile</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {toastMessage && (
        <div className={`toast ${toastType}`}>
          {toastMessage}
        </div>
      )}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-logo-section">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt="Company Logo" className="company-logo" />
          ) : (
            <div className="company-logo placeholder">Upload Logo</div>
          )}
          <label htmlFor="file-upload" className="upload-btn">
            {uploading ? 'Uploading...' : 'Change Logo'}
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
          <label>Company Name</label>
          <input type="text" name="name" value={profile.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            rows="4"
            value={profile.description}
            onChange={handleChange}
            placeholder="Describe your company..."
          ></textarea>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input type="text" name="location" value={profile.location} onChange={handleChange} placeholder="City, Country" />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}