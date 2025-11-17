"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import "./CoordinatorSidebar.css";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  Briefcase,
  Megaphone,
  Settings,
  LogOut,
} from "lucide-react";

export default function CoordinatorSidebar() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("fullname, user_type")
          .eq("id", user.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = "/";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h3>InternLink</h3>
        <small>{profile?.user_type || "Coordinator"}</small>
      </div>

      <nav className="sidebar-nav">
        <Link href="/coordinator/dashboard">
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </Link>

        <Link href="/coordinator/students">
          <Users size={18} />
          <span>Students</span>
        </Link>

        <Link href="/coordinator/approvals">
          <CheckSquare size={18} />
          <span>Approvals</span>
        </Link>

        <Link href="/coordinator/companies">
          <Building2 size={18} />
          <span>Companies</span>
        </Link>

        <Link href="/coordinator/dashboard#internships">
          <Briefcase size={18} />
          <span>Internships</span>
        </Link>

        <Link href="/coordinator/announcements">
          <Megaphone size={18} />
          <span>Announcements</span>
        </Link>

        <Link href="/coordinator/settings">
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="sidebar-bottom">
        <p>{profile ? profile.fullname : "Loading..."}</p>
        <button onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
