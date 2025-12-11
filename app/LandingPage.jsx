"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js"; 
import "./LandingPage.css"; 
import { 
  FiCpu, FiCheckCircle, FiTrendingUp, FiUsers, 
  FiFileText, FiShield, FiArrowRight, FiSun, FiMoon, FiInfo 
} from "react-icons/fi";
import { BsStars, BsBuilding, BsMortarboard } from "react-icons/bs";

// 🟢 SAFE INITIALIZATION
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export default function HomePage() {
  const [theme, setTheme] = useState("dark");
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [showAllJobs, setShowAllJobs] = useState(false);
  
  const toggleTheme = () => {
    setTheme((curr) => (curr === "light" ? "dark" : "light"));
  };

  // 🟢 FETCH COMPANIES LOGIC
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('companies') 
          .select('*') 
          .limit(2); 

        if (data) setRecentCompanies(data);
      } catch (err) {
        console.error("Unexpected Error:", err);
      }
    };

    fetchCompanies();
  }, []);

  // Smooth scroll for "Back to Top"
useEffect(() => {
  const button = document.getElementById("backToTopBtn");
  if (!button) return;

  const handleClick = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  button.addEventListener("click", handleClick);

  return () => button.removeEventListener("click", handleClick);
}, []);


  // 🟢 FETCH JOB TITLES LOGIC
  useEffect(() => {
    const fetchJobTitles = async () => {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('job_posts')
          .select('title');

        if (data) {
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
      
      {/* Inline styles to handle the new layout changes immediately */}
      <style jsx>{`
        .cta-split-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .about-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .about-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--primary-color, #EE7428);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .about-card p {
          color: var(--text-muted, #94a3b8);
          line-height: 1.6;
          font-size: 1.1rem;
        }
        @media (max-width: 968px) {
          .cta-split-layout {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .hero-visual {
            margin-top: 2rem;
          }
        }
      `}</style>

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
      <section id="top" className="hero-section">
        {/* Left Side: Hero Text */}
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

        {/* Right Side: REDESIGNED ABOUT VISUAL (Expanded Text) */}
        <div className="hero-visual reveal-on-scroll delay-200">
           <div className="about-showcase-card">
              <div className="card-glow"></div>
              
              <div className="about-content-inner">
                <div className="about-header">
                  <div className="icon-circle"><FiCpu /></div>
                  <h3>About InternLink</h3>
                </div>
                
                <div className="about-text-content">
                  <p>
                    InternLink revolutionizes the internship experience by replacing outdated manual logbooks and paper resumes with a <strong>unified digital platform</strong>.
                  </p>
                  <p style={{marginTop: '12px'}}>
                    We empower <strong>Universities</strong> with real-time monitoring, help <strong>Companies</strong> spot talent instantly via AI, and give <strong>Students</strong> a verified career head start.
                  </p>
                </div>

                {/* Mini Stats Grid */}
                <div className="about-mini-stats">
                  <div className="mini-stat">
                    <span className="stat-val">AI</span>
                    <span className="stat-label">Matching</span>
                  </div>
                  <div className="mini-stat">
                    <span className="stat-val">100%</span>
                    <span className="stat-label">Paperless</span>
                  </div>
                  <div className="mini-stat">
                    <span className="stat-val"><FiShield /></span>
                    <span className="stat-label">Verified</span>
                  </div>
                </div>
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

        <div 
            className="role-card"
            style={{
                // Using a linear gradient overlay so text remains readable over the image
                backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('/assets/building.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
          >
            <div className="icon-box orange"><BsBuilding /></div>
            <h3>Companies</h3>
            <p>Post internships, manage applicants, and submit evaluations in one portal.</p>
            <ul className="feature-list">
              <li><FiCheckCircle /> Talent Analytics</li>
              <li><FiCheckCircle /> Automated Evaluations</li>
            </ul>
          </div>

        <div 
            className="role-card"
            style={{
                // Using a linear gradient overlay so text remains readable over the image
                backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('/assets/school.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
          >
          
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

            {/* --- 6. CTA SECTION + DYNAMIC FLOATING UI (Moved Here) --- */}
      <section className="cta-wrapper reveal-on-scroll">
        <div className="cta-split-layout">
          
          {/* Left: CTA Text */}
          <div className="cta-box" style={{textAlign: 'left', margin: 0}}>
            <h2>Ready to streamline your internship program?</h2>
            <p style={{marginBottom: '20px', color: 'var(--text-muted)'}}>
              Join thousands of students and companies already using InternLink.
            </p>
            <div className="cta-buttons" style={{justifyContent: 'flex-start'}}>
               <Link href="/auth/coordinatorAuthPage" className="btn btn-primary">
                 Partner with us (Schools)
               </Link>
               <Link href="/auth/internAuthPage" className="btn btn-outline">
                 I'm a Student <FiArrowRight />
               </Link>
            </div>
          </div>

          {/* Right: Dynamic Floating UI (Moved from Hero) */}
          <div className="hero-visual" style={{width: '100%'}}>
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
            <a href="#top" id="backToTopBtn">Back to Top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}