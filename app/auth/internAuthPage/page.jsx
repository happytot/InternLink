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

export default function InternAuthPage() {
  const router = useRouter();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ fullname: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const showMessage = (text, color = 'red') => {
    setMessage({ text, color });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleGoBack = () => router.push('/');

  // ✅ --- UPDATED LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    const { email, password } = loginData;

    // 1. Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showMessage(translateSupabaseError(error));
      return;
    }

    if (data.user) {
      // 2. Check their role in the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      // 3. Verify the role
      if (profile && profile.user_type === 'student') {
        // ✅ SUCCESS: Role is correct
        router.push('/intern/dashboard'); 
      } else {
        // ❌ WRONG ROLE: Log them out immediately
        await supabase.auth.signOut();
        showMessage('❌ Access Denied. This is not an intern account.');
      }
    } else {
      showMessage('❌ Login failed.');
    }
  };

// --- UPDATED SIGNUP HANDLER ---
const handleSignup = async (e) => {
  e.preventDefault();
  setMessage('');
  const { fullname, email, password } = signupData;

  // 1. Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    showMessage(translateSupabaseError(error));
    return;
  }

  // 2. Create their profile manually using known values
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: data.user.id,   // OK
        fullname: fullname, // OK
        email: email,       // ← FIXED — use YOUR email variable
        user_type: 'student',
        created_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      showMessage(`❌ Error creating profile: ${profileError.message}`);
      return;
    }

    showMessage('✅ Signup successful! Please log in.', 'green');
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
      <div className={styles.container}>
        <button className={styles.backButton} onClick={handleGoBack}>
          &times;
        </button>

        {/* LOGIN FORM (No HTML changes needed) */}
        <div className={`${styles.formBox} ${!isLoginView ? styles.hidden : ''}`}>
          <h2>Intern Login</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={loginData.email} onChange={handleLoginChange} required />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={loginData.password} onChange={handleLoginChange} required />
            </div>
            <button type="submit">Login as Intern</button>
            <p>
              Don't have an account?{' '}
              <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(false)}>
                Sign up
              </button>
            </p>
          </form>
          {message && isLoginView && <div style={{ color: message.color, marginTop: '10px' }}>{message.text}</div>}
        </div>

        {/* SIGNUP FORM (No HTML changes needed) */}
        <div className={`${styles.formBox} ${isLoginView ? styles.hidden : ''}`}>
          <h2>Intern Sign Up</h2>
          <form onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label htmlFor="fullname">Full Name</label>
              <input type="text" id="fullname" value={signupData.fullname} onChange={handleSignupChange} required />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={signupData.email} onChange={handleSignupChange} required />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={signupData.password} onChange={handleSignupChange} required />
            </div>
            <button type="submit">Sign Up as Intern</button>
            <p>
              Already have an account?{' '}
              <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(true)}>
                Login
              </button>
            </p>
          </form>
          {message && !isLoginView && <div style={{ color: message.color, marginTop: '10px' }}>{message.text}</div>}
        </div>
      </div>
    </div>
  );
}