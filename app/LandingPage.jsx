"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./LandingPage.css"; 
import { 
  FiCpu, FiCheckCircle, FiTrendingUp, FiUsers, 
  FiFileText, FiShield, FiArrowRight, FiSun, FiMoon 
} from "react-icons/fi";
import { BsStars, BsBuilding, BsMortarboard } from "react-icons/bs";

export default function HomePage() {
  // 1. State for Theme
  const [theme, setTheme] = useState("dark");

  // 2. Toggle Logic
  const toggleTheme = () => {
    setTheme((curr) => (curr === "light" ? "dark" : "light"));
  };

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

  return (
    // 3. Apply the theme class dynamically here
    <div className={`homepage-wrapper ${theme === "light" ? "light-mode" : ""}`}>
      
      {/* ✨ Background Elements ✨ */}
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

                    {/* THEME TOGGLE BUTTON */}
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

        {/* Dynamic Floating UI Element */}
        <div className="hero-visual reveal-on-scroll delay-200">
          <div className="glass-card float-animation">
            <div className="card-header">
              <div className="circle bg-red"></div>
              <div className="circle bg-yellow"></div>
              <div className="circle bg-green"></div>
            </div>
            <div className="card-content">
              <div className="match-row">
                <div className="avatar">JD</div>
                <div className="text-block">
                  <strong>John Doe</strong> matched with <strong>TechCorp</strong>
                  <div className="skill-tags">
                    <span>React</span><span>Node.js</span><span>98% Match</span>
                  </div>
                </div>
              </div>
              <div className="match-row">
                <div className="avatar av-2">AS</div>
                <div className="text-block">
                  <strong>Anna Smith</strong> submitted <strong>Daily Log</strong>
                  <div className="progress-bar"><div className="fill" style={{width: '80%'}}></div></div>
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

      {/* --- 5. CTA SECTION --- */}
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