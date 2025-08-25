import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import pic from "./suryanshi.jpeg";


const LOCAL_KEY = "ddms_user_profile";

// helper to read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error("Problem parsing input file."));
    };
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const defaultProfile = {
  name: "Suryanshi Singh",
  email: "suryanshi.singh2023@vitstudent.ac.in",
  phone: "9923457283",
  avatar: pic, // placeholder avatar (same as Home dummy)
  disastersReported: 2, // sample stat, update as needed
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // load from localStorage if available
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
        setDraft(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not load profile from localStorage", err);
    }
  }, []);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function handleEdit() {
    setEditing(true);
  }

  function handleCancel() {
    setDraft(profile);
    setEditing(false);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setDraft((d) => ({ ...d, avatar: dataUrl }));
    } catch (err) {
      alert("Could not read the selected image.");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    const newProfile = { ...profile, ...draft };
    setProfile(newProfile);
    setEditing(false);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(newProfile));
    } catch (err) {
      console.warn("Could not save profile to localStorage", err);
    }
  }

  function handleResetAvatar() {
    setDraft((d) => ({ ...d, avatar: defaultProfile.avatar }));
  }

  return (
    <div className="profile-page">
      <header className="profile-header" role="banner">
        <h1 className="profile-title">My Profile</h1>
        <div className="profile-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/ReportDisaster")}
            aria-label="Report an incident"
          >
            Report a Disaster
          </button>
        </div>
      </header>

      <main className="profile-content" role="main">
        <section
          className="card profile-card"
          aria-labelledby="profile-info-heading"
        >
          <h2 id="profile-info-heading" className="sr-only">
            Profile Information
          </h2>

          <div className="profile-top">
            <div className="avatar-wrap">
              <img
                src={editing ? draft.avatar : profile.avatar}
                alt={`${profile.name} avatar`}
                className="avatar-img"
              />
              <div className="avatar-controls">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  id="avatarFile"
                  className="sr-only"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  Upload Avatar
                </button>
                <button
                  type="button"
                  className="btn btn-tertiary"
                  onClick={handleResetAvatar}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="profile-summary">
              <h3 className="profile-name">{profile.name}</h3>
              <p className="profile-email">{profile.email}</p>
              {profile.phone && <p className="profile-phone">{profile.phone}</p>}
              <div className="profile-stats" aria-label="Profile statistics">
                <div className="stat-item">
                  <div className="stat-value">{profile.disastersReported}</div>
                  <div className="stat-label">Disasters Reported</div>
                </div>
                {/* Add other stats here if needed */}
              </div>

              {!editing && (
                <div className="summary-actions">
                  <button
                    className="btn btn-outline"
                    onClick={handleEdit}
                    aria-label="Edit profile"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {editing && (
            <form className="profile-form" onSubmit={handleSave} aria-label="Edit profile form">
              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={draft.name} onChange={handleChange} />
              </div>

              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={draft.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={draft.phone} onChange={handleChange} />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="card quick-actions" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading">Quick Actions</h2>
          <div className="quick-list">
            <button
              className="btn btn-full"
              onClick={() => navigate("/Report Disaster")}
            >
              Report Disaster
            </button>
            <button
              className="btn btn-full btn-outline"
              onClick={() => {
                alert("Change password flow - implement as needed.");
              }}
            >
              Change Password
            </button>
            <button
              className="btn btn-full btn-outline"
              onClick={() => {
                // sign-out example
                localStorage.removeItem(LOCAL_KEY);
                alert("Logged out (local demo). You may redirect to login here.");
              }}
            >
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}