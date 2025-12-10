"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
// 🟢 FIX 1: Import the core function correctly
import { createClient } from "@supabase/supabase-js"; 
import "./LandingPage.css"; 
import { 
  FiCpu, FiCheckCircle, FiTrendingUp, FiUsers, 
  FiFileText, FiShield, FiArrowRight, FiSun, FiMoon 
} from "react-icons/fi";
import { BsStars, BsBuilding, BsMortarboard } from "react-icons/bs";

// 🟢 SAFE INITIALIZATION
// This prevents the app from crashing if the keys are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🟢 FIX 2: Only create client if keys exist
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export default function HomePage() {
  const [theme, setTheme] = useState("dark");
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [showAllJobs, setShowAllJobs] = useState(false);
  
  // 🔴 REMOVE THIS LINE: const supabase = createClientComponentClient(); 
  // We use the 'supabase' variable defined outside to avoid crashes.

  const toggleTheme = () => {
    setTheme((curr) => (curr === "light" ? "dark" : "light"));
  };

  // 🟢 FETCH COMPANIES LOGIC
  useEffect(() => {
    const fetchCompanies = async () => {
      // 1. Safety Check: Stop if Supabase isn't ready
      if (!supabase) {
        console.error("⚠️ Supabase Client is missing. Check your .env.local file and restart the server.");
        return;
      }

      try {
        console.log("🔄 Fetching companies...");
        
        // 2. The Query
        const { data, error } = await supabase
          .from('companies') 
          .select('*') 
          .limit(2); 

        if (error) {
          console.error("🛑 Supabase API Error:", error.message);
        } else if (data) {
          console.log("✅ Companies Fetched:", data);
          setRecentCompanies(data);
        }
      } catch (err) {
        console.error("Unexpected Error:", err);
      }
    };

    fetchCompanies();
  }, []);

  // 🟢 FETCH JOB TITLES LOGIC
  useEffect(() => {
    const fetchJobTitles = async () => {
      if (!supabase) return; // Safety check

      try {
        const { data, error } = await supabase
          .from('job_posts')
          .select('title');

        if (error) {
          console.error("Error fetching job titles:", error);
          return;
        }

        if (data) {
          // Remove duplicates
          const uniqueTitles = [...new Set(data.map(item => item.title))];
          const cleanTitles = uniqueTitles.filter(title => title && title.trim() !== "");
          setJobTitles(cleanTitles);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchJobTitles();
  }, []);

  // Scroll Animation Logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const visibleJobs = showAllJobs ? jobTitles : jobTitles.slice(0, 20);

  return (
    <div className={`homepage-wrapper ${theme === "light" ? "light-mode" : ""}`}>
      
      <div className="bg-gradient-orb orb-1"></div>
      <div className="bg-gradient-orb orb-2"></div>

      {/* --- 1. HEADER --- */}
      <header className="main-header">
        <div className="logo-container">
          <span className="intern-text">Intern</span>
          <span className="link-text">Link</span>
        </div>
        
        <nav className="desktop-nav">
          <Link href="/auth/internAuthPage" className="nav-link">Students</Link>
          <Link href="/auth/companyAuthPage" className="nav-link">Companies</Link>

          <Link href="/auth/coordinatorAuthPage" className="nav-cta">
            Coordinator Portal
          </Link>

          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
        </nav>
      </header>

      {/* --- 2. HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-text reveal-on-scroll">
          <div className="badge-capsule">
            <BsStars className="icon-yellow" /> 
            <span>Now with AI-Powered Matching</span>
          </div>
          <h1>
            The Future of <br />
            <span className="gradient-text">Internship Management</span>
          </h1>
          <p className="hero-sub">
            InternLink bridges the gap between education and industry. 
            Our AI connects students to the right companies while automating 
            OJT monitoring for schools.
          </p>
          
          <div className="hero-actions">
            <Link href="/auth/internAuthPage" className="btn btn-primary">
              Get Started
            </Link>
            <Link href="#features" className="btn btn-glass">
              Explore Features
            </Link>
          </div>
        </div>

        {/* --- DYNAMIC FLOATING UI ELEMENT --- */}
        <div className="hero-visual reveal-on-scroll delay-200">
          <div className="glass-card float-animation">
            <div className="card-header">
              <div className="circle bg-red"></div>
              <div className="circle bg-yellow"></div>
              <div className="circle bg-green"></div>
            </div>
            
            <div className="card-content">
              {recentCompanies.length > 0 ? (
                recentCompanies.map((company, index) => {
                  const displayName = company.company_name || company.name || "Unknown Company";
                  const displayIndustry = company.industry || company.sector || "Partner";
                  const initials = displayName.substring(0, 2).toUpperCase();

                  return (
                    <div className="match-row" key={company.id || index}>
                      <div className={`avatar ${index === 1 ? 'av-2' : ''}`}>
                        {initials}
                      </div>
                      <div className="text-block">
                        <strong>{displayName}</strong> is now hiring
                        <div className="skill-tags">
                          <span>{displayIndustry}</span>
                          <span style={{color: '#22c55e'}}>Active</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="match-row">
                  <div className="avatar">IL</div>
                  <div className="text-block">
                     <strong>InternLink System</strong>
                     <div className="skill-tags">
                       <span>Waiting for data...</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. ECOSYSTEM (User Roles) --- */}
      <section className="ecosystem-section reveal-on-scroll">
        <h2>Built for the Entire Ecosystem</h2>
        <div className="ecosystem-grid">
          <div className="role-card">
            <div className="icon-box blue"><BsMortarboard /></div>
            <h3>Students</h3>
            <p>Build your skills profile, get AI-matched to internships, and track your hours digitally.</p>
            <ul className="feature-list">
              <li><FiCheckCircle /> AI Resume Parser</li>
              <li><FiCheckCircle /> One-click Apply</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="icon-box orange"><BsBuilding /></div>
            <h3>Companies</h3>
            <p>Post internships, manage applicants, and submit evaluations in one portal.</p>
            <ul className="feature-list">
              <li><FiCheckCircle /> Talent Analytics</li>
              <li><FiCheckCircle /> Automated Evaluations</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="icon-box green"><FiUsers /></div>
            <h3>Schools</h3>
            <p>Monitor attendance, view logbooks, and generate reports for CHED/TESDA.</p>
            <ul className="feature-list">
              <li><FiCheckCircle /> Real-time Monitoring</li>
              <li><FiCheckCircle /> Analytics Dashboard</li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- 4. BENTO GRID FEATURES --- */}
      <section id="features" className="bento-section">
        <div className="section-header reveal-on-scroll">
          <h2>Intelligent Features</h2>
          <p>Powered by Machine Learning and Blockchain Technology.</p>
        </div>

        <div className="bento-grid">
          <div className="bento-item large reveal-on-scroll">
            <div className="bento-content">
              <FiCpu className="bento-icon" />
              <h3>AI-Powered Matching Algorithm</h3>
              <p>We analyze course data, skills, and past placements to predict the perfect internship fit.</p>
            </div>
            <div className="visual-overlay-ai"></div>
          </div>

          <div className="bento-item medium reveal-on-scroll delay-100">
            <FiFileText className="bento-icon" />
            <h3>Digital Logbooks</h3>
            <p>Automated daily time tracking with geofencing and supervisor approval workflow.</p>
          </div>

          <div className="bento-item medium reveal-on-scroll delay-200">
            <FiShield className="bento-icon" />
            <h3>Blockchain Certificates</h3>
            <p>Tamper-proof, verifiable internship completion certificates.</p>
          </div>

          <div className="bento-item wide reveal-on-scroll delay-300">
            <div className="bento-flex">
              <div>
                <FiTrendingUp className="bento-icon" />
                <h3>Institutional Analytics</h3>
                <p>Generate placement rates, partner engagement reports, and student performance trends instantly.</p>
              </div>
              <div className="graph-visual">
                <div className="bar b1"></div>
                <div className="bar b2"></div>
                <div className="bar b3"></div>
                <div className="bar b4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. JOB BUBBLES --- */}
      <section className="job-bubbles-section reveal-on-scroll">
        <div className="job-bubbles-container">
          <div className="job-header">
            <h2>Find the right job or <br /> internship for you</h2>
          </div>
          
          <div className="bubbles-wrapper">
            {visibleJobs.length > 0 ? (
              visibleJobs.map((title, index) => (
                <Link 
                  href={`/jobs/search?q=${encodeURIComponent(title)}`} 
                  key={index} 
                  className="job-bubble"
                >
                  {title}
                </Link>
              ))
            ) : (
              <p style={{color: 'var(--text-muted)'}}>Loading job categories...</p>
            )}
            
            {jobTitles.length > 10 && (
              <button 
                className="bubble-toggle-btn"
                onClick={() => setShowAllJobs(!showAllJobs)}
              >
                {showAllJobs ? "Show Less" : "Show more"} 
                <FiArrowRight style={{transform: showAllJobs ? "rotate(270deg)" : "rotate(90deg)"}} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* --- 6. CTA SECTION --- */}
      <section className="cta-wrapper reveal-on-scroll">
        <div className="cta-box">
          <h2>Ready to streamline your internship program?</h2>
          <div className="cta-buttons">
             <Link href="/auth/coordinatorAuthPage" className="btn btn-primary">
               Partner with us (Schools)
             </Link>
             <Link href="/auth/internAuthPage" className="btn btn-outline">
               I'm a Student <FiArrowRight />
             </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-brand">
              <span className="intern-text">Intern</span>Link
              <p>© 2025. Transforming Education.</p>
          </div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}