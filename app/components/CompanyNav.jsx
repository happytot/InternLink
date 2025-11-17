'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaPlusCircle, FaList, FaUsers, FaUserCircle, FaComments } from 'react-icons/fa';
import './CompanyNav.css';

const CompanyNav = ({ visible = true }) => {
  const pathname = usePathname();

  const links = [
    { href: '/company/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { href: '/company/jobs/new', label: 'Post Job', icon: <FaPlusCircle /> },
    { href: '/company/jobs/listings', label: 'Listings', icon: <FaList /> },
    { href: '/company/applicants', label: 'Applicants', icon: <FaUsers /> },

    // ⭐ NEW: MESSAGES TAB
    { href: '/company/messages', label: 'Messages', icon: <FaComments /> },

    { href: '/company/profile', label: 'Profile', icon: <FaUserCircle /> },
  ];

  return (
    <nav className={`company-nav ${visible ? '' : 'hidden'}`}>
      <div className="nav-links-container">
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default CompanyNav;
