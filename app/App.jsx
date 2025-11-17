// src/App.jsx (Updated with NewJobPost import and route)

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 

// Import layout components
import Header from './components/Header';
import InternNav from './components/InternNav';
import CompanyNav from './components/CompanyNav';

// Import authentication pages
import InternAuthPage from './pages/auth/InternAuthPage'; 
import CompanyAuthPage from './pages/auth/CompanyAuthPage'; 
import LandingPage from './pages/LandingPage'; 

// Import intern portal pages
import InternDashboard from './pages/intern/InternDashboard'; 
import Listings from './pages/intern/Listings'; 
import ApplicationHistory from './pages/intern/ApplicationHistory'; 
import InternProfile from './pages/intern/Profile'; 

// Import company portal pages
import CompanyDashboard from './pages/company/CompanyDashboard';
// 👇 1. IMPORT NewJobPost
import NewJobPost from './pages/company/NewJobPost'; 
/* import JobPostings from './pages/company/JobPostings'; */ 
/* import PostJob from './pages/company/PostJob'; */ 

function App() {

  // Layout wrapper for logged-in Intern users
  const InternLayout = ({ children }) => (
	<>
	  <Header />
	  <InternNav /> 
	  <main className="intern-main">{children}</main>
	</>
  );

  // Layout wrapper for logged-in Company users 
  const CompanyLayout = ({ children }) => (
  <>
	<Header />
	<CompanyNav /> 
	<main className="company-main">{children}</main>
  </>
);
  

  return (
	<BrowserRouter>
	  <Routes>
		
		{/* Route 1: Landing Page (Public) */}
		<Route path="/" element={<><Header /><LandingPage /><Footer /></>} />
		
		{/* Route 2 & 3: Dedicated Authentication Pages (Public) */}
		<Route path="/auth/intern" element={<InternAuthPage />} />
		<Route path="/auth/company" element={<CompanyAuthPage />} />
		
		{/* -------------------- LOGGED-IN INTERN ROUTES -------------------- */}
		<Route path="/intern" element={<InternLayout><InternDashboard /></InternLayout>} /> 
		<Route path="/intern/listings" element={<InternLayout><Listings /></InternLayout>} />
		<Route path="/intern/history" element={<InternLayout><ApplicationHistory /></InternLayout>} />
		<Route path="/intern/profile" element={<InternLayout><InternProfile /></InternLayout>} />
		
		{/* -------------------- LOGGED-IN COMPANY ROUTES -------------------- */}
<Route path="/company" element={<CompanyLayout><CompanyDashboard /></CompanyLayout>} />
		
		{/* 👇 2. ADD THE ROUTE FOR THE NEW JOB POST PAGE */}
<Route 
	path="/company/jobs/new" 
	element={<CompanyLayout><NewJobPost /></CompanyLayout>} 
/>
		
		{/* Example of future company routes using the new structure */}
		{/*
		<Route path="/company/jobs" element={<CompanyLayout><JobPostings /></CompanyLayout>} />
		*/}
		
	  </Routes>
	</BrowserRouter>
  );
}

export default App;