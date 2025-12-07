'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation'; // Removed Link import
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from 'next-themes';
import styles from './AdminSidebar.module.css'; 
import { 
  FiHome, 
  FiUsers, 
  FiBriefcase, 
  FiLogOut,
  FiSun,
  FiMoon
} from 'react-icons/fi'; 

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
    router.refresh();
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  const toggleTheme = (e) => {
    if (!document.startViewTransition) {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  const getButtonClass = (path) => {
    return pathname === path 
      ? `${styles.navButton} ${styles.activeBtn}` 
      : styles.navButton;
  };

  return (
    <div className={styles.sidebar}>
      
      {/* --- Header --- */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.brand}>
            Intern<span>Link</span>
          </h2>
          <span className={styles.subBrand}>Admin Portal</span>
        </div>

        {mounted && (
          <button
            onClick={toggleTheme} 
            className={styles.themeBtn}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        )}
      </div>

      {/* --- Navigation (Now using Buttons) --- */}
      <nav className={styles.nav}>
        <button 
          onClick={() => handleNavigation('/admin')} 
          className={getButtonClass('/admin')}
        >
          <FiHome size={20} />
          <span>Overview</span>
        </button>

        <button 
          onClick={() => handleNavigation('/admin/users')} 
          className={getButtonClass('/admin/users')}
        >
          <FiUsers size={20} />
          <span>User Management</span>
        </button>

        <button 
          onClick={() => handleNavigation('/admin/jobs')} 
          className={getButtonClass('/admin/jobs')}
        >
          <FiBriefcase size={20} />
          <span>Job Moderation</span>
        </button>
      </nav>

      {/* --- Footer --- */}
      <div className={styles.footer}>
        <button 
          onClick={handleSignOut}
          className={`${styles.navButton} ${styles.logoutBtn}`}
        >
          <FiLogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}