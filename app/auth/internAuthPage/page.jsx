'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Make sure this path points to the shared file generated above!
import styles from '../../components/AuthPage.module.css'; 
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner'; 
import { FaEye, FaEyeSlash, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from 'next-themes';

// --- UTILS ---
const translateSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred.';
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login')) return 'Invalid Credentials. Please check your email and password.';
  if (msg.includes('already registered')) return 'This email address is already registered.';
  return error.message;
};

export default function InternAuthPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // --- THEME & UI STATE ---
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // --- FORM STATE ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ 
    fullname: '', 
    email: '', 
    password: '' 
  });

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  // --- HANDLERS ---
  const handleGoBack = () => router.push('/');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // --- LOGIN LOGIC (UPDATED FOR ADMIN) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // 2. ✅ LOGIC FIX: Refresh BEFORE logic to prime the router
      router.refresh(); 

      // 3. 🔍 FETCH PROFILE TO CHECK ROLE & TYPE
      // We need to fetch both 'user_type' (for students) and 'role' (for admins)
      const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type') // <--- Added 'role' here
          .eq('id', data.user.id)
          .single();

      // Handle cases where profile might not exist immediately (rare but possible)
      if (profileError && profileError.code !== 'PGRST116') {
          console.error("Profile fetch error:", profileError);
      }

      // --- 👑 ADMIN CHECK ---
      if (profile?.user_type === 'admin') {
          toast.success("Welcome, Admin!");
          router.replace('/admin'); // Redirect to Admin Dashboard
          return; // Stop execution here
      }

      // --- 🎓 STUDENT CHECK ---
      // Check Metadata first (Fast) or Database (Safe)
      const metaType = data.user?.user_metadata?.user_type;
      let isStudent = false;

      if (metaType === 'student') {
        isStudent = true;
      } else if (profile?.user_type === 'student') {
        isStudent = true;
      }

      if (isStudent) {
        router.replace('/intern/dashboard'); // Or /intern/dashboard
        toast.success("Welcome back!");
      } else {
        // If they are not an Admin AND not a Student, kick them out
        await supabase.auth.signOut();
        toast.error('Access Denied', { description: 'This account is not registered as an Intern.' });
      }

    } catch (err) {
      toast.error('Login Failed', { description: translateSupabaseError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  // --- SIGNUP LOGIC (UNCHANGED) ---
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullname: formData.fullname,
            user_type: 'student', // Defaults to student
          },
        },
      });

      if (error) throw error;

      if (data.session) {
          router.refresh();
          router.replace('/intern/listings');
          toast.success('Account Created!', { description: 'Welcome to the platform.' });
      } else {
          toast.success('Signup Successful!', { description: 'Please check your email to verify your account.' });
          setFormData({ fullname: '', email: '', password: '' });
          setIsLoginView(true);
      }

    } catch (err) {
      toast.error('Signup Failed', { description: translateSupabaseError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.bodyContainer}>
      {/* ✅ IMPORTANT: Toaster must be rendered to see notifications */}
      <Toaster richColors position="top-center" />

      {/* 🌗 THEME TOGGLE */}
      <button
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        type="button"
      >
        {resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
      </button>

      <div className={styles.container}>
        <div className={styles.formContainer}>
          
          <button className={styles.backButton} onClick={handleGoBack}>
            &times;
          </button>

          {/* LOGIN FORM */}
          <div className={`${styles.formBox} ${!isLoginView ? styles.hidden : ''}`}>
            <h2>Intern Login</h2>
            <form onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login as Intern'}
              </button>
              
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setIsLoginView(false)}
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </p>
            </form>
          </div>

          {/* SIGNUP FORM */}
          <div className={`${styles.formBox} ${isLoginView ? styles.hidden : ''}`}>
            <h2>Intern Sign Up</h2>
            <form onSubmit={handleSignup}>
              <div className={styles.inputGroup}>
                <label htmlFor="fullname">Full Name</label>
                <input
                  type="text"
                  id="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    minLength={6} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up as Intern'}
              </button>
              
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setIsLoginView(true)}
                  disabled={isLoading}
                >
                  Login
                </button>
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}