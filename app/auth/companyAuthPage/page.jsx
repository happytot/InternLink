'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from '../../components/AuthPage.module.css';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { FaEye, FaEyeSlash, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from 'next-themes';

const translateSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred.';
  if (error.message.includes('Invalid login')) return 'Invalid Credentials. Please check your details.';
  if (error.message.includes('already registered')) return 'This email is already registered.';
  return error.message;
};

export default function CompanyAuthPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    companyName: '', 
    email: '', 
    password: '' 
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const userType = data.user?.user_metadata?.user_type;

      if (userType === 'company') {
        router.refresh();
        router.push('/company/dashboard');
      } else {
        await supabase.auth.signOut();
        toast.error('Access Denied', { description: 'This is not a company account.' });
      }
    } catch (err) {
      toast.error('Login Failed', { description: translateSupabaseError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.companyName,
            user_type: 'company',
          },
        },
      });

      if (error) throw error;

      toast.success('Signup Successful!', { description: `Welcome, ${formData.companyName}. Please check email to verify.` });
      setFormData({ companyName: '', email: '', password: '' });
      setIsLoginView(true);
    } catch (err) {
      toast.error('Signup Failed', { description: translateSupabaseError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
   <div className={styles.bodyContainer}>
    {/* 🍞 Styled via global CSS */}

    <button
      className={styles.themeToggle}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>

    <div className={styles.container}>
      <div className={styles.formContainer}>
        <button className={styles.backButton} onClick={() => router.push('/')}>&times;</button>

        {/* LOGIN FORM */}
        <div className={`${styles.formBox} ${!isLoginView ? styles.hidden : ''}`}>
          <h2>Company Login</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="login-password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login as Company'}
            </button>
            <p>
              Don't have an account?{' '}
              <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(false)}>Sign up</button>
            </p>
          </form>
        </div>

        {/* SIGNUP FORM */}
        <div className={`${styles.formBox} ${isLoginView ? styles.hidden : ''}`}>
          <h2>Company Sign Up</h2>
          <form onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label htmlFor="signup-company">Company Name</label>
              <input
                type="text"
                id="signup-company"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="signup-password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="signup-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up as Company'}
            </button>
            <p>
              Already have an account?{' '}
              <button type="button" className={styles.linkButton} onClick={() => setIsLoginView(true)}>Login</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
}