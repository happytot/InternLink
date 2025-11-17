'use client'; // ✅ Make this a Client Component

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

export default function CompanyAuthPage() {
  const router = useRouter();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ companyName: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const showMessage = (text, color = 'red') => {
    setMessage({ text, color });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleGoBack = () => router.push('/');

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    const { email, password } = loginData;

    const { data: user, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showMessage(translateSupabaseError(error));
      return;
    }

    if (!user) {
      showMessage('❌ Login failed.');
      return;
    }

    // Optional: verify user type in Supabase profiles table
    router.push('/company/dashboard'); // Redirect to Company Dashboard
  };

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');

    const { companyName, email, password } = signupData;

    const { data: user, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      showMessage(translateSupabaseError(error));
      return;
    }

    if (user) {
      // Optional: save additional profile info in Supabase "profiles" table
      await supabase.from('profiles').insert([
        {
           id: data.user.id, 
          company_name: companyName,
          email,
          user_type: 'company',
          created_at: new Date().toISOString(),
        },
      ]);

      showMessage(`✅ Signup successful for ${companyName}! Please log in.`, 'green');
      setSignupData({ companyName: '', email: '', password: '' });
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

        {/* LOGIN FORM */}
        <div className={`${styles.formBox} ${!isLoginView ? styles.hidden : ''}`}>
          <h2>Company Login</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={loginData.email} onChange={handleLoginChange} required />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={loginData.password} onChange={handleLoginChange} required />
            </div>

            <button type="submit">Login as Company</button>

            <p>
              Don't have an account?{' '}
              <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(false)}>
                Sign up
              </button>
            </p>
          </form>
          {message && isLoginView && <div style={{ color: message.color, marginTop: '10px' }}>{message.text}</div>}
        </div>

        {/* SIGNUP FORM */}
        <div className={`${styles.formBox} ${isLoginView ? styles.hidden : ''}`}>
          <h2>Company Sign Up</h2>
          <form onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label htmlFor="companyName">Company Name</label>
              <input type="text" id="companyName" value={signupData.companyName} onChange={handleSignupChange} required />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={signupData.email} onChange={handleSignupChange} required />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={signupData.password} onChange={handleSignupChange} required />
            </div>

            <button type="submit">Sign Up as Company</button>

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
