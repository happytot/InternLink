'use client';

import { useState } from 'react';
// 1. ⛔️ REMOVED your old supabase import
// import { supabase } from '../../../lib/supabase';

// 2. ✅ ADDED this import instead
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import styles from '../../components/AuthPage.module.css';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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

export default function CompanyAuthPage() {
  const router = useRouter();

  // 3. ✅ INITIALIZED the client *inside* the component
  const supabase = createClientComponentClient();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    companyName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoBack = () => router.push('/');

// --- UPDATED LOGIN HANDLER (Checks 'profiles' table) ---
// --- UPDATED LOGIN HANDLER (Checks metadata) ---
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
      // 1. Get the user_type from the metadata returned by auth.
      //    This is the most reliable check.
      const userType = data.user.user_metadata?.user_type;

      // 2. Check the userType
      if (userType === 'company') {
        router.refresh(); // Refresh the cookie session
        router.push('/company/dashboard');
      } else {
        // This will run if user_type is missing (like your account) or not 'company'
        await supabase.auth.signOut();
        toast.error('Access Denied. This is not a company account.');
      }
    } else {
      toast.error('Login failed.');
    }
  };

  // --- 5. ✅ UPDATED SIGNUP HANDLER (Uses Trigger) ---
  const handleSignup = async (e) => {
    e.preventDefault();
    const { companyName, email, password } = signupData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Pass data to the SQL trigger
      options: {
        data: {
          company_name: companyName, // Matches our new SQL trigger
          user_type: 'company',
        },
      },
    });

    if (error) {
      toast.error(translateSupabaseError(error));
      return;
    }

    // We no longer need to .insert() into profiles!
    toast.success(`Signup successful for ${companyName}! Please log in.`);
    setSignupData({ companyName: '', email: '', password: '' });
    setIsLoginView(true);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.id]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.id]: e.target.value });
  };

  // --- JSX (No changes) ---
  return (
   <div className={styles.bodyContainer}>
    <Toaster richColors position="top-right" />
    <div className={styles.container}>
      {/* RIGHT FORM SIDE */}
      <div className={styles.formContainer}>
        <button className={styles.backButton} onClick={handleGoBack}>
          &times;
        </button>

        {/* LOGIN FORM */}
        <div className={`${styles.formBox} ${!isLoginView ? styles.hidden : ''}`}>
          <h2>Company Login</h2>
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

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
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

            <button type="submit">Login as Company</button>

            <p>
              Don't have an account?{" "}
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
          <h2>Company Sign Up</h2>
          <form onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                value={signupData.companyName}
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

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
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

            <button type="submit">Sign Up as Company</button>

            <p>
              Already have an account?{" "}
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
  </div>
  );
}