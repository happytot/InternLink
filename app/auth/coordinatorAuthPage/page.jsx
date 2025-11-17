'use client'; 

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import styles from '../../components/AuthPage.module.css';
import { useRouter } from 'next/navigation';

const translateSupabaseError = (error) => {
  if (!error) return '';
  switch (error.message) {
    case 'Invalid login credentials':
      return '❌ Invalid Credentials. Please check your email and password.';
    case 'User already registered':
      return '❌ This email address is already registered.';
    default:
      return `❌ ${error.message}`;
  }
};

export default function CoordinatorAuthPage() {
  const router = useRouter();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ fullName: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const showMessage = (text, color = 'red') => {
    setMessage({ text, color });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleGoBack = () => router.push('/');

  // --- LOGIN HANDLER (This logic is correct and unchanged) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    const { email, password } = loginData;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showMessage(translateSupabaseError(error));
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        showMessage('❌ Profile not found.');
        return;
      }

      if (profile.user_type === 'coordinator') {
        router.push('/coordinator/dashboard'); 
      } else {
        await supabase.auth.signOut();
        showMessage('❌ You are not authorized as a coordinator.');
      }
    } else {
      showMessage('❌ Login failed.');
    }
  };

  // ✅ --- UPDATED SIGNUP HANDLER (USING TRIGGER) ---
  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    const { fullName, email, password } = signupData;

    // 1. Sign up the user with metadata
    // The SQL trigger will read this metadata to create the profile.
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          user_type: 'coordinator', // This will be read by the trigger
          fullname: fullName        // This will be read by the trigger
        }
      }
    });

    if (error) {
      showMessage(translateSupabaseError(error));
      return;
    }

    // 2. That's it! The trigger handles the profile creation.
    // We just show a message telling them to check their email.
    showMessage(`✅ Signup successful! Please check your email to confirm your account.`, 'green');
    setSignupData({ fullName: '', email: '', password: '' });
    setIsLoginView(true);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.bodyContainer}>
      <div className={styles.container}>
        <button className={styles.backButton} onClick={handleGoBack}>
          &times;
        </button>

        {/* LOGIN FORM (No HTML changes) */}
        <div className={`${styles.formBox} ${!isLoginView ? styles.hidden : ''}`}>
          <h2>Coordinator Login</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="email-login">Email</label>
              <input
                type="email"
                id="email-login"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password-login">Password</label>
              <input
                type="password"
                id="password-login"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
            </div>
            <button type="submit">Login as Coordinator</button>
            <p>
              Don’t have an account?{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setIsLoginView(false)}
              >
                Sign up
              </button>
            </p>
          </form>
          {message && isLoginView && (
            <div style={{ color: message.color, marginTop: '10px' }}>{message.text}</div>
          )}
        </div>

        {/* SIGNUP FORM (No HTML changes) */}
        <div className={`${styles.formBox} ${isLoginView ? styles.hidden : ''}`}>
          <h2>Coordinator Sign Up</h2>
          <form onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label htmlFor="fullName-signup">Full Name</label>
              <input
                type="text"
                id="fullName-signup"
                name="fullName"
                value={signupData.fullName}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email-signup">Email</label>
              <input
                type="email"
                id="email-signup"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password-signup">Password</label>
              <input
                type="password"
                id="password-signup"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
              />
            </div>
            <button type="submit">Sign Up as Coordinator</button>
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
          {message && !isLoginView && (
            <div style={{ color: message.color, marginTop: '10px' }}>{message.text}</div>
          )}
        </div>
      </div>
    </div>
  );
}