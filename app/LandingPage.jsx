"use client";

import Link from "next/link";
import { useEffect } from "react";
import "./LandingPage.css";
// ✨ --- IMPORT THE ICONS --- ✨
import { FiUserCheck, FiSend } from "react-icons/fi";
import { BsStars } from "react-icons/bs";

export default function LandingPage() {
  // This useEffect handles the fade-in-on-scroll animation
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, 
      }
    );

    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* --- 1. HEADER --- */}
      <header className="landing-header">
        
        {/* ✨ --- THIS IS THE UPDATED LOGO --- ✨ */}
        <div className="logo">
          <span className="intern-part">Intern</span>
          <span className="link-part">Link</span>
        </div>
        
        <nav className="main-nav">
          <Link href="/auth/coordinatorAuthPage" className="btn btn-secondary btn-small">
            Sign In as Coordinator
          </Link>
        </nav>
      </header>

      {/* --- 2. HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Find the right internship. Build the right future.</h1>
          <p className="description">
            InternLink bridges the gap between students and companies. Our AI
            helps you land the right internship, gain real-world skills, and
            launch your future.
          </p>
          <div className="buttons">
            <Link href="/auth/internAuthPage" className="btn btn-primary">
              Join as a Student
            </Link>
            <Link href="/auth/companyAuthPage" className="btn btn-secondary">
              Join as a Company
            </Link>
          </div>
        </div>
        <div className="hero-image fade-in">
          <img
            src="https://www.codedesk.in/images/cwdt.png"

            alt="Internship platform illustration"
          />
        </div>
      </section>

      {/* --- 3. FEATURES ("How it works") SECTION --- */}
      <section className="features-section">
        <h2 className="fade-in">Get Hired in 3 Simple Steps</h2>
        <div className="steps-container">
          
          <div className="step-card fade-in">
            <div className="step-number">1</div>
            <FiUserCheck className="step-icon" />
            <h3>Build Your Profile</h3>
            <p>
              Create a skills-based profile that showcases what you can do for
              employers.
            </p>
          </div>
          
          <div className="step-card fade-in">
            <div className="step-number">2</div>
            <BsStars className="step-icon" />
            <h3>Get AI-Matched</h3>
            <p>
              Our AI instantly matches your unique skills to the perfect
              internship roles.
            </p>
          </div>
          
          <div className="step-card fade-in">
            <div className="step-number">3</div>
            <FiSend className="step-icon" />
            <h3>Apply & Connect</h3>
            <p>
              Apply with one click and connect directly with top companies
              looking for talent like you.
            </p>
          </div>

        </div>
      </section>

      {/* --- 4. FINAL CALL TO ACTION --- */}
      <section className="cta-section fade-in">
        <h2>Ready to Launch Your Career?</h2>
        <p>Join thousands of students and hundreds of companies on InternLink.</p>
        <div className="buttons">
            <Link href="/auth/internAuthPage" className="btn btn-primary">
              Find Your Internship
            </Link>
          </div>
      </section>

      {/* --- 5. FOOTER --- */}
      <footer className="landing-footer">
        <p>© 2025 InternLink. All rights reserved.</p>
      </footer>
    </div>
  );
}