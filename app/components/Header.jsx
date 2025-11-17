"use client"; // optional — only needed if this component uses state, hooks, or event handlers

import Link from "next/link"; // ✅ Use Next.js Link for navigation
import css from "/app/index.css";
 
export default function Header() {
  return (
    <header className="bg-white shadow-md py-4">
      <nav className="container mx-auto flex items-center justify-between px-6">
        {/* Logo Section */}
        <div className="logo text-2xl font-bold">
          <span className="intern-part">Intern</span>
          <span className="link-part">Link</span>
        </div>

      
      </nav>
    </header>
  );
}
