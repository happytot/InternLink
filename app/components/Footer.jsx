"use client"; // only if it contains hooks or interactive elements

import Link from "next/link";
import css from "/app/index.css";
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        {/* Logo / Branding */}
        <div className="text-xl font-semibold mb-4 md:mb-0">
          <span className="text-blue-500">Intern</span>
          <span className="text-white">Link</span>
        </div>

        {/* Footer Links */}
        

        {/* Copyright */}
        <p className="text-xs text-gray-500 mt-4 md:mt-0">
          © {new Date().getFullYear()} InternLink. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
