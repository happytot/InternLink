"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./companies.css";

// Import icons
import {
  FaInfoCircle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBuilding,
  FaSearch,
  FaThList,
  FaThLarge
} from "react-icons/fa";

export default function CoordinatorCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, description, location, logo_url, updated_at");

    if (error) console.error("Supabase error:", error);
    setCompanies(data || []);
    setLoading(false);
  };

  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyLogo = (url) =>
    url && url.trim() !== ""
      ? url
      : "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";

  return (
    <div className="coordinator-page">
      <CoordinatorSidebar />

      <div className="students-content">
        <div className="header-section">
          <h2>Companies</h2>

          <div className="actions">
            <div style={{ position: "relative" }}>
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
              />
            </div>

            <div className="view-toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={viewMode === "card"}
                  onChange={() =>
                    setViewMode(viewMode === "table" ? "card" : "table")
                  }
                />
                <span className="slider"></span>
              </label>
              {viewMode === "table" ? <FaThList /> : <FaThLarge />}
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading companies...</p>
        ) : viewMode === "table" ? (
          <table className="students-table">
            <thead>
              <tr>
                <th>#</th>
                <th> <FaCalendarAlt style={{ marginRight: "5px" }} />Updated</th>
                <th>Company Name</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td>
                   
                    {c.updated_at
                      ? new Date(c.updated_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    <FaBuilding style={{ marginRight: "5px" }} />
                    {c.name || "N/A"}
                  </td>
                  <td>
                    <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                    {c.location || "N/A"}
                  </td>
                  <td>
                    <button
                      className="info-btn"
                      onClick={() => setSelectedCompany(c)}
                    >
                      <FaInfoCircle style={{ marginRight: "5px" }} />
                      Full Info
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card-container">
            {filteredCompanies.map((c, index) => (
              <div className="student-card" key={c.id}>
                <img
                  src={getCompanyLogo(c.logo_url)}
                  alt={c.name}
                  className="student-avatar"
                />
                <h3>
                  {index + 1}. {c.name || "N/A"}
                </h3>
                <p>
                  <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                  {c.location || "N/A"}
                </p>
                <div className="card-actions">
                  <button
                    className="info-btn"
                    onClick={() => setSelectedCompany(c)}
                  >
                    <FaInfoCircle style={{ marginRight: "5px" }} />
                    Full Info
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====================== MODAL ======================= */}
      {selectedCompany && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedCompany(null)}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Company Profile</h2>

            <div className="profile-picture-section">
              <img
                src={getCompanyLogo(selectedCompany.logo_url)}
                alt={selectedCompany.name}
                className="profile-picture"
              />
            </div>

            <div className="profile-section">
              <h3>Company Details</h3>
              <div className="info-grid">
                <p>
                  <FaBuilding style={{ marginRight: "5px" }} />
                  <strong>Name:</strong> {selectedCompany.name || "N/A"}
                </p>
                <p>
                  <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                  <strong>Location:</strong> {selectedCompany.location || "N/A"}
                </p>
                <p>
                  <FaCalendarAlt style={{ marginRight: "5px" }} />
                  <strong>Last Updated:</strong>{" "}
                  {selectedCompany.updated_at
                    ? new Date(selectedCompany.updated_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="profile-section">
              <h3>Description</h3>
              <p>{selectedCompany.description || "No description provided."}</p>
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setSelectedCompany(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
