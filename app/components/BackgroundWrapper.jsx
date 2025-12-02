import React from 'react';

export const BackgroundWrapper = ({ children, className = "" }) => {
  return (
    <div className={`homepage-wrapper ${className}`}>
      
      {/* 🎨 Background Orbs 
         These use the variables --orb-1 and --orb-2 from your globals.css
      */}
      <div className="bg-gradient-orb orb-1 orb-float" />
      <div className="bg-gradient-orb orb-2 orb-float" />

      {/* 📄 Page Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
      
    </div>
  );
};