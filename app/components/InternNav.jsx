'use client'; 

import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import './InternNav.css'; 
import { LuLayoutDashboard, LuClipboardList, LuUser, LuHistory, LuMessageCircle } from "react-icons/lu"; // added chat icon

export default function InternNav({ className }) {
    const pathname = usePathname();
    const navClassName = `intern-nav ${className || ''}`;

    return (
        <nav className={navClassName}>
            <div className="nav-links-container">
                
                <Link 
                    href="/intern/dashboard"
                    className={pathname === '/intern/dashboard' ? 'nav-link active' : 'nav-link'}
                >
                    <span className="nav-icon">
                        <LuLayoutDashboard />
                    </span>
                    <span className="nav-label">
                        Dashboard
                    </span>
                </Link>
                
                <Link 
                    href="/intern/listings"
                    className={pathname.startsWith('/intern/listings') ? 'nav-link active' : 'nav-link'}
                >
                    <span className="nav-icon">
                        <LuClipboardList />
                    </span>
                    <span className="nav-label">
                        Listings
                    </span>
                </Link>
                
                <Link 
                    href="/intern/history"
                    className={pathname.startsWith('/intern/history') ? 'nav-link active' : 'nav-link'}
                >
                    <span className="nav-icon">
                        <LuHistory />
                    </span>
                    <span className="nav-label">
                        Status History
                    </span>
                </Link>
                
                <Link 
                    href="/intern/profile"
                    className={pathname.startsWith('/intern/profile') ? 'nav-link active' : 'nav-link'}
                >
                    <span className="nav-icon">
                        <LuUser />
                    </span>
                    <span className="nav-label">
                        Profile
                    </span>
                </Link>

                {/* --- New Chat Link --- */}
                <Link 
                    href="/intern/messages"
                    className={pathname.startsWith('/intern/messages') ? 'nav-link active' : 'nav-link'}
                >
                    <span className="nav-icon">
                        <LuMessageCircle />
                    </span>
                    <span className="nav-label">
                        Messages
                    </span>
                </Link>

            </div>
        </nav>
    );
};
