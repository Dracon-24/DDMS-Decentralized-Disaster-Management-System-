import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import localDB from "../db/pouchdb";

// Fix Leaflet icon URLs for build environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Approximate center of India
const MAP_CENTER = [22.9734, 78.6569];

// Sample disaster markers

// === StatusCard Component ===
function StatusCard({ title, count, color }) {
  const colorClasses = ["red", "yellow", "blue"];
  const cardColorClass = colorClasses.includes(color) ? color : "blue";

  return (
    <div
      className={`status-card ${cardColorClass}`}
      tabIndex={0}
      role="region"
      aria-label={`${title}: ${count}`}
    >
      <h3>{title}</h3>
      <p>{count}</p>
    </div>
  );
}

// === UserAvatar Component ===
function UserAvatar({ user, onLogout}) {
  const navigate = useNavigate();
  return (
    <div className="user-avatar" tabIndex={0} aria-label={`Logged in as ${user.name}`}>
      <button onClick={() => navigate("/Profile")} className="avatar-image">
        <img
          src={user.profilePic}
          alt={`${user.name}'s profile`}
          className="avatar-image"
          style={{ cursor: "pointer" }}
        />
      </button>
      <button onClick={onLogout} className="logout-button" aria-label="Logout">
        &times;
      </button>

    </div>
  );
}

// === NavigationMenu Component ===
function NavigationMenu({ onSelectPage }) {
  const navigate = useNavigate();
  return (
    <nav className="nav-menu" aria-label="Main navigation">
      <button onClick={() => onSelectPage("safeRoute")} className="nav-button">
        Safe Route
      </button>
      <button onClick={() => navigate("/ReportSOS")} className="nav-button">
        Report SOS
      </button>
      <button onClick={() => navigate("/ReportDisaster")} className="nav-button">
        Report Disaster
      </button>
      <button onClick={() => onSelectPage("reliefTracker")} className="nav-button">
        Report Resource Center
      </button>
    </nav>
  );
}

// === Placeholder Pages ===
function SafeRoute() {
  return (
    <section className="feature-page" aria-label="Safe Route Page">
      <h2>Safe Route Planner</h2>
      <p>
        Plan a safe route avoiding recent disaster locations. (Feature coming soon.)
      </p>
    </section>
  );
}

function ReportSOS() {
  return (
    <section className="feature-page" aria-label="Report SOS Page">
      <h2>Report SOS</h2>
      <p>
        Quickly send an SOS alert to nearby responders and authorities. (Feature coming soon.)
      </p>
    </section>
  );
}

function ReportIncident() {
  return (
    <section className="feature-page" aria-label="Report Incident Page">
      <h2>Report Incident</h2>
      <p>
        Submit details about a new disaster or emergency incident. (Feature coming soon.)
      </p>
    </section>
  );
}

function ReliefTracker() {
  return (
    <section className="feature-page" aria-label="Relief Resource Tracker Page">
      <h2>Relief Resource Tracker</h2>
      <p>
        Track distribution and availability of relief resources in affected areas. (Feature coming soon.)
      </p>
    </section>
  );
}

// === Main Home Component ===
function Home() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [disasters, setDisasters] = useState([]);
  const [alertsCount] = useState(7);
  const [sosActive] = useState(3);
  const [selectedPage, setSelectedPage] = useState(null);

  // Dummy logged-in user info with profile pic URL
  const dummyUser = {
    name: "Kumar Manthan",
    email: "kumar.manthan2023@vitstudent.ac.in",
    profilePic:
      "https://i.pravatar.cc/48?img=12", // Random avatar placeholder URL; replace as needed
  };

  // Online/offline event handlers
  const handleOnline = useCallback(() => setIsOnline(true), []);
  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    async function fetchDisasters() {
      try {
        const result = await localDB.allDocs({ include_docs: true });
        const docs = result.rows.map((row) => row.doc);
        console.log("All disaster documents:", docs);
        setDisasters(docs);
      } catch (error) {
        console.error("Failed to fetch disaster reports from local DB:", error);
      }
    }
    fetchDisasters();
  }, []);



  // Content switcher based on page selection
  let mainContent;
  if (selectedPage === "safeRoute") {
    mainContent = <SafeRoute />;
  } else if (selectedPage === "reportSOS") {
    mainContent = <ReportSOS />;
  } else if (selectedPage === "reportIncident") {
    mainContent = <ReportIncident />;
  } else if (selectedPage === "reliefTracker") {
    mainContent = <ReliefTracker />;
  } else {
    // Render dashboard: nav + status + map
    mainContent = (
      <>
        <NavigationMenu onSelectPage={setSelectedPage} />
        <main className="status-cards" aria-label="Status Overview">
          <StatusCard
            title="Disasters Detected"
            count={disasters.length}
            color="red"
          />
          <StatusCard title="Active Alerts" count={alertsCount} color="yellow" />
          <StatusCard title="SOS Active" count={sosActive} color="blue" />
        </main>

        {!isOnline && (
          <div
            className="offline-banner"
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
          >
            You are offline. Changes will sync when you’re back online.
          </div>
        )}

        <section className="map-section" aria-label="Live Disaster Map">
          <h2>Live Disaster Map</h2>
          <MapContainer
            center={MAP_CENTER}
            zoom={5}
            className="leaflet-container"
            aria-describedby="mapDesc"
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            {disasters.filter(disaster => disaster.position && disaster.position.length === 2).map((disaster, idx) => (
                <Marker key={idx} position={[disaster.position[0], disaster.position[1]]}>
                  <Popup>
                    <strong>{disaster.disasterType}</strong><br />
                    Severity: {disaster.severity}<br />
                    {disaster.description}
                  </Popup>
                </Marker>
            ))}


          </MapContainer>
          <p id="mapDesc" className="sr-only">
            Interactive map showing locations and severity levels of recent disasters.
          </p>
        </section>
      </>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header with title and dummy user avatar */}
      <header className="header-bar">
        <h1 className="app-title">Decentralized Disaster Management System</h1>
        <UserAvatar user={dummyUser}/>
      </header>

      {/* Main content */}
      <div className="app-content">{mainContent}</div>
    </div>
  );
}

export default Home;