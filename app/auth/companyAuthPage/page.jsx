'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase'; // <-- Corrected path
import styles from '../../components/AuthPage.module.css'; // <-- Corrected path
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // <-- Added icons

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

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    companyName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoBack = () => router.push('/');

  // LOGIN
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

    if (!data.user) {
      toast.error('Login failed.');
      return;
    }
    router.push('/company/dashboard');
  };

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();

    const { companyName, email, password } = signupData;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(translateSupabaseError(error));
      return;
    }

    if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          company_name: companyName,
          email,
          user_type: 'company',
          created_at: new Date().toISOString(),
        },
      ]);

      toast.success(`Signup successful for ${companyName}! Please log in.`);
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
      <Toaster richColors position="top-right" />

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

            <button type="submit">Login as Company</button>

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

            <button type="submit">Sign Up as Company</button>

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