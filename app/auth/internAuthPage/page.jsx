'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase'; // <-- Corrected path
import styles from '../../components/AuthPage.module.css'; // <-- Corrected path
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // <-- Added icons

// Helper function to translate errors for the toast
const translateSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred.';
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid Credentials. Please check your email and password.';
    case 'User already registered':
      return 'This email address is already registered.';
    default:
      return error.message;
  }
};

export default function InternAuthPage() {
  const router = useRouter();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    fullname: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoBack = () => router.push('/');

  // ✅ --- UPDATED LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginData;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(translateSupabaseError(error));
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      if (profile && profile.user_type === 'student') {
        router.push('/intern/dashboard');
      } else {
        await supabase.auth.signOut();
        toast.error('Access Denied. This is not an intern account.');
      }
    } else {
      toast.error('Login failed.');
    }
  };

  // --- UPDATED SIGNUP HANDLER ---
  const handleSignup = async (e) => {
    e.preventDefault();
    const { fullname, email, password } = signupData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(translateSupabaseError(error));
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          fullname: fullname,
          email: email,
          user_type: 'student',
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        toast.error(`Error creating profile: ${profileError.message}`);
        return;
      }

      toast.success('Signup successful! Please log in.');
      setSignupData({ fullname: '', email: '', password: '' });
      setIsLoginView(true);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.id]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.id]: e.target.value });
  };

  return (
    <div className={styles.bodyContainer}>
      <Toaster richColors position="top-right" />

      <div className={styles.container}>
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
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>
            {/* --- Updated Password Input --- */}
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit">Login as Intern</button>
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setIsLoginView(false)}
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
                value={signupData.fullname}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
            </div>
            {/* --- Updated Password Input --- */}
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit">Sign Up as Intern</button>
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setIsLoginView(true)}
              >
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}