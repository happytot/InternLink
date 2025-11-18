'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
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

export default function CoordinatorAuthPage() {
  const router = useRouter();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoBack = () => router.push('/');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginData;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(translateSupabaseError(error));
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
        toast.error('Profile not found.');
        return;
      }

      if (profile.user_type === 'coordinator') {
        router.push('/coordinator/dashboard');
      } else {
        await supabase.auth.signOut();
        toast.error('You are not authorized as a coordinator.');
      }
    } else {
      toast.error('Login failed.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { fullName, email, password } = signupData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { user_type: 'coordinator', fullname: fullName } },
    });

    if (error) {
      toast.error(translateSupabaseError(error));
      return;
    }

    toast.success('Signup successful! Please check your email to confirm your account.');
    setSignupData({ fullName: '', email: '', password: '' });
    setIsLoginView(true);
  };

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleSignupChange = (e) =>
    setSignupData({ ...signupData, [e.target.name]: e.target.value });

  return (
    <div className={styles.bodyContainer}>
      <Toaster richColors position="top-right" />

      <div className={styles.container}>
        

        {/* RIGHT SIDE FORM */}
        <div className={styles.formContainer}>
          <button className={styles.backButton} onClick={handleGoBack}>
            &times;
          </button>

          {/* LOGIN FORM */}
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
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password-login"
                    name="password"
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

              <button type="submit">Login as Coordinator</button>
              <p>
                Don’t have an account?{' '}
                <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(false)}>
                  Sign up
                </button>
              </p>
            </form>
          </div>

          {/* SIGNUP FORM */}
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
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password-signup"
                    name="password"
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

              <button type="submit">Sign Up as Coordinator</button>
              <p>
                Already have an account?{' '}
                <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(true)}>
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
