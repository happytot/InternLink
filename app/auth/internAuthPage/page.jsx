'use client';

import { useState } from 'react';
// 1. ✅ CORRECT: Using createClientComponentClient
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from '../../components/AuthPage.module.css';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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

  // 2. ✅ CORRECT: Initializing client inside the component
  const supabase = createClientComponentClient();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    fullname: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoBack = () => router.push('/');

// --- UPDATED LOGIN HANDLER (FIX) ---
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
      //    This avoids the RLS query problem.
      const userType = data.user.user_metadata?.user_type;

      // 2. Check the userType from the metadata
      if (userType === 'student') {
        // We add a router.refresh() to ensure the root layout re-fetches the session
        router.refresh();
        router.push('/intern/dashboard');
      } else {
        // This will run if user_type is missing or not 'student'
        await supabase.auth.signOut();
        toast.error('Access Denied. This is not a student account.');
      }
    } else {
      toast.error('Login failed.');
    }
  };

  // --- 3. ✅ UPDATED SIGNUP HANDLER (Uses Trigger) ---
  const handleSignup = async (e) => {
    e.preventDefault();
    const { fullname, email, password } = signupData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Pass data to the SQL trigger
      options: {
        data: {
          fullname: fullname,
          user_type: 'student',
        },
      },
    });

    if (error) {
      toast.error(translateSupabaseError(error));
      return;
    }

    // We no longer need to .insert() into profiles!
    // The trigger handles it.
    toast.success('Signup successful! Please check your email to verify and then log in.');
    setSignupData({ fullname: '', email: '', password: '' });
    setIsLoginView(true);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.id]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.id]: e.target.value });
  };

  // --- JSX (No changes needed) ---
  return (
    <div className={styles.bodyContainer}>
      <Toaster richColors position="top-right" />

      {/* CONTAINER REVERTED TO BE JUST THE FORM WRAPPER */}
      <div className={styles.container}>
        {/* RIGHT SIDE FORMS (Now centered and full width of container) */}
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
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>

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
        </div>{' '}
        {/* END formContainer */}
      </div>{' '}
      {/* END container */}
    </div>
  );
}