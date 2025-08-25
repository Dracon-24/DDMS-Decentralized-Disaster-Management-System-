import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon URLs for many build environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Default center (approx center of India)
const MAP_CENTER = [22.9734, 78.6569];
const DEFAULT_ZOOM = 9;

// Small helper component: listens for clicks and updates parent via setLocation
function MapClickHandler({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function ReportSOS() {
  const [affectedPeople, setAffectedPeople] = useState("");
  const [severity, setSeverity] = useState(5);
  const [description, setDescription] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const mapRef = useRef(null);

  // Auto-detect location using Geolocation API
  const handleAutoDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Geolocation is not supported by your browser." });
      return;
    }
    setIsDetectingLocation(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLocation([lat, lng]);
        // Attempt to center map if ref exists
        if (mapRef.current) {
          try {
            mapRef.current.setView([lat, lng], 13);
          } catch (e) {
            // ignore
          }
        }
        setIsDetectingLocation(false);
      },
      (err) => {
        setMessage({ type: "error", text: "Unable to detect location. Please allow location access or select on the map." });
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle file selection and generate preview for images
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setFilePreviewUrl(null);

    if (f && f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreviewUrl(reader.result);
      };
      reader.readAsDataURL(f);
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      setFilePreviewUrl(null);
    };
  }, []);

  // Basic client-side validation
  const validate = () => {
    if (!affectedPeople || Number(affectedPeople) <= 0) {
      setMessage({ type: "error", text: "Please enter the number of affected people (greater than 0)." });
      return false;
    }
    if (!severity || Number(severity) < 1 || Number(severity) > 10) {
      setMessage({ type: "error", text: "Please provide a severity between 1 and 10." });
      return false;
    }
    if (!selectedLocation) {
      setMessage({ type: "error", text: "Please select a location on the map or use Auto-detect." });
      return false;
    }
    if (!description || description.trim().length < 10) {
      setMessage({ type: "error", text: "Please provide a description (at least 10 characters)." });
      return false;
    }
    return true;
  };

  // Submit handler (simulated)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      // Build FormData (suitable for file uploads). Replace URL with your endpoint.
      const formData = new FormData();
      formData.append("affectedPeople", affectedPeople);
      formData.append("severity", severity);
      formData.append("description", description);
      formData.append("latitude", selectedLocation[0]);
      formData.append("longitude", selectedLocation[1]);
      if (file) {
        formData.append("file", file);
      }

      // Example: Replace with your API endpoint. For now we'll simulate with a timeout.
      // const resp = await fetch("/api/report-sos", { method: "POST", body: formData });
      // const data = await resp.json();

      await new Promise((res) => setTimeout(res, 1000)); // simulate network delay

      setMessage({ type: "success", text: "SOS reported successfully. Responders will be notified." });
      // Reset form (optional)
      setAffectedPeople("");
      setSeverity(5);
      setDescription("");
      setSelectedLocation(null);
      setFile(null);
      setFilePreviewUrl(null);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to submit. Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-sos-page">
      <h1>Report SOS</h1>

      <form className="report-sos-form" onSubmit={handleSubmit} aria-labelledby="report-sos-heading">
        <p id="report-sos-heading" className="sr-only">Form to report an SOS with affected people, severity, location, description and optional file upload.</p>

        {message && (
          <div
            className={`form-message ${message.type === "error" ? "error" : "success"}`}
            role={message.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="affectedPeople">Number of affected people *</label>
          <input
            id="affectedPeople"
            name="affectedPeople"
            type="number"
            min="1"
            value={affectedPeople}
            onChange={(e) => setAffectedPeople(e.target.value)}
            required
            aria-required="true"
            className="input-number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="severity">Severity (1 - 10) *</label>
          <input
            id="severity"
            name="severity"
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={severity}
            required
            className="input-range"
          />
          <div className="severity-value" aria-hidden="true">Selected severity: {severity}</div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            rows="6"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            aria-required="true"
            placeholder="Describe the situation, number of injured, immediate dangers, nearby landmarks, urgent needs, etc."
            className="textarea"
          />
        </div>

        <fieldset className="form-group" aria-labelledby="location-legend">
          <legend id="location-legend">Location *</legend>

          <div className="location-controls">
            <button type="button" onClick={handleAutoDetectLocation} disabled={isDetectingLocation} className="button">
              {isDetectingLocation ? "Detecting location..." : "Auto-detect My Location"}
            </button>
            <p className="location-instruction">Or click on the map to select a precise location.</p>
          </div>

          <div className="map-wrap" role="region" aria-label="Map for selecting SOS location">
            <MapContainer
              center={selectedLocation || MAP_CENTER}
              zoom={selectedLocation ? 13 : DEFAULT_ZOOM}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
              className="sos-map-container"
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler setLocation={setSelectedLocation} />
              {selectedLocation && (
                <Marker position={selectedLocation}>
                  <Popup>
                    Selected location: Latitude {selectedLocation[0].toFixed(6)}, Longitude {selectedLocation[1].toFixed(6)}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          <p className="selected-location" aria-live="polite">
            {selectedLocation
              ? `Selected location: Latitude ${selectedLocation[0].toFixed(6)}, Longitude ${selectedLocation[1].toFixed(6)}`
              : "No location selected yet."}
          </p>
        </fieldset>

        <div className="form-group">
          <label htmlFor="file">Attach file or image (optional)</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="input-file"
          />
          {filePreviewUrl && (
            <div className="preview-list" aria-hidden="false">
              <p>Preview:</p>
              <img src={filePreviewUrl} alt="Selected file preview" className="preview-image" />
            </div>
          )}
          {file && !filePreviewUrl && (
            <div className="preview-list">
              <p>Selected file: {file.name}</p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="button primary">
            {submitting ? "Submitting..." : "Submit SOS"}
          </button>
        </div>
      </form>
    </div>
  );
}