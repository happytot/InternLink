'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import '../globals.css'
import './InternNav.css';
import { 
  LuLayoutDashboard, 
  LuClipboardList, 
  LuUser, 
  LuHistory, 
  LuBuilding, 
  LuMenu, 
  LuX 
} from "react-icons/lu";
import { FaSun, FaMoon } from 'react-icons/fa';

export default function InternNav({ className }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Lock body scroll on mobile menu open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!mounted) return null;

    return (
        <>
            {/* 1. Overlay - Only visible when mobile menu is open */}
            <div 
                className={`nav-overlay ${isOpen ? 'visible' : ''}`} 
                onClick={() => setIsOpen(false)} 
            />

            {/* 2. Main Header Bar (Always Visible) */}
            <header className={`intern-header ${className || ''}`}>
                
                {/* Logo - Always visible on the left */}
                <div className="logo-container">
                    <span className="intern-text">Intern</span>
                    <span className="link-text">Link</span>
                </div>

                {/* 3. Navigation Container 
                    - Desktop/Tablet: displays inline
                    - Mobile: slides in from right
                */}
                <nav className={`nav-menu ${isOpen ? 'open' : ''}`}>
                    <div className="nav-links">
                        <Link 
                            href="/intern/dashboard"
                            className={pathname === '/intern/dashboard' ? 'nav-link active' : 'nav-link'}
                        >
                            <span className="nav-icon"><LuLayoutDashboard /></span>
                            <span className="nav-text">Dashboard</span>
                        </Link>
                        
                        <Link 
                            href="/intern/listings"
                            className={pathname.startsWith('/intern/listings') ? 'nav-link active' : 'nav-link'}
                        >
                            <span className="nav-icon"><LuClipboardList /></span>
                            <span className="nav-text">Listings</span>
                        </Link>
                        
                        <Link 
                            href="/intern/history"
                            className={pathname.startsWith('/intern/history') ? 'nav-link active' : 'nav-link'}
                        >
                            <span className="nav-icon"><LuHistory /></span>
                            <span className="nav-text">History</span>
                        </Link>
                        
                        <Link
                            href="/intern/companies"
                            className={pathname.startsWith('/intern/companies') ? 'nav-link active' : 'nav-link'}
                        >
                            <span className="nav-icon"><LuBuilding /></span>
                            <span className="nav-text">Companies</span>
                        </Link>

                        <Link 
                            href="/intern/profile"
                            className={pathname.startsWith('/intern/profile') ? 'nav-link active' : 'nav-link'}
                        >
                            <span className="nav-icon"><LuUser /></span>
                            <span className="nav-text">Profile</span>
                        </Link>
                    </div>

                    <div className="nav-actions">
                        <button
                            className="theme-toggle-btn"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <FaSun /> : <FaMoon />}
                        </button>
                    </div>
                </nav>

                {/* Hamburger Toggle - Only visible on Mobile (< 550px) */}
                <button 
                    className="nav-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <LuX /> : <LuMenu />}
                </button>
            </header>
        </>
    );
};