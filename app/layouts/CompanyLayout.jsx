import React from 'react';
import { Outlet } from 'react-router-dom';
import CompanyNav from '../components/CompanyNav'; // The new navigation
import Header from '../components/Header'; // Your existing header component
import './CompanyLayout.css'; // Create this CSS file next

const CompanyLayout = () => {
    return (
        <div className="company-layout-wrapper">
            
            {/* 1. Universal Top Bar / Header */}
            <Header /> 

            {/* 2. Company-Specific Navigation */}
            <CompanyNav /> 

            {/* 3. Main Content Area: Where nested routes render */}
            <div className="company-content-container">
                <Outlet />
            </div>

            {/* Note: You can add a Footer component here if needed */}
        </div>
    );
};

export default CompanyLayout;