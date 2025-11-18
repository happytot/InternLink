'use client'; 

import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import './InternNav.css'; 
import { LuLayoutDashboard, LuClipboardList, LuUser, LuHistory, LuMessageCircle, LuBuilding } from "react-icons/lu"; // added building icon

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
                
                

                {/* New Companies link */}
                <Link
                    href="/intern/companies"
                    className={pathname.startsWith('/intern/companies') ? 'nav-link active' : 'nav-link'}
                >
                    <span className="nav-icon">
                        <LuBuilding />
                    </span>
                    <span className="nav-label">
                        Companies
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
            </div>
        </nav>
    );
};
