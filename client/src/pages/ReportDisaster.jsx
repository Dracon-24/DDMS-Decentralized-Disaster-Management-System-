import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ReportDisaster.css"
import localDB from "../db/pouchdb";

// Fix Leaflet icon URLs (same as your Home.jsx setup)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Predefined disaster types
const DISASTER_TYPES = [
  "Flood",
  "Earthquake",
  "Cyclone",
  "Wildfire",
  "Landslide",
  "Tsunami",
  "Volcanic Eruption",
  "Other",
];

// Default center if geolocation not available
const DEFAULT_POSITION = [22.9734, 78.6569]; // Approx India center

// Component to update map center on location change
function LocationMarker({ position, setPosition }) {
  const [draggable, setDraggable] = useState(true);

  const eventHandlers = {
    dragend(e) {
      const marker = e.target;
      const latLng = marker.getLatLng();
      setPosition([latLng.lat, latLng.lng]);
    },
  };

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={position}
      autoPan={true}
    />
  );
}

function ReportDisaster() {
  const [disasterType, setDisasterType] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [severity, setSeverity] = useState(5);
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Attempt geolocation on mount
  useEffect(() => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setIsLocating(false);
      }
    );
  }, []);

  // Handle file input change with preview generation
  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setFilePreviewUrl(null);
      return;
    }
    setFile(selectedFile);

    // Create preview URL only if image/video
    if (selectedFile.type.startsWith("image/") || selectedFile.type.startsWith("video/")) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const validateForm = () => {
    const errors = {};
    if (!disasterType) errors.disasterType = "Please select a disaster type.";
    if (!description.trim()) errors.description = "Please provide a description.";
    if (!position || position.length !== 2) errors.position = "Please select a valid location.";
    if (!(severity >= 1 && severity <= 10)) errors.severity = "Severity must be between 1 and 10.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const reportDoc = {
    _id: new Date().toISOString(),
    disasterType,
    description: description.trim(),
    latitude: position[0],
    longitude: position[1],
    severity,
    createdAt: new Date().toISOString()
  };

  try {
    await localDB.put(reportDoc);
    console.log("Saved to local PouchDB:", reportDoc);

    localDB.allDocs({ include_docs: true }).then((result) => {
      console.log("Current local documents:", result.rows.map(row => row.doc));
    });

    alert("Report saved offline and will sync to server automatically!");

    // Reset form
    setDisasterType("");
    setDescription("");
    setPosition(DEFAULT_POSITION);
    setSeverity(5);
    setFile(null);
    setFilePreviewUrl(null);
    setFormErrors({});
  } catch (err) {
    console.error("PouchDB save failed:", err);
    alert("Failed to save report locally.");
  }
};


  return (
    <div className="report-page">
      <h1 className="page-title">Report a Disaster</h1>
      <form onSubmit={handleSubmit} className="report-form" noValidate>
        {/* Disaster Type */}
        <div className="form-group">
          <label htmlFor="disasterType">Disaster Type *</label>
          <select
            id="disasterType"
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
            aria-invalid={formErrors.disasterType ? "true" : "false"}
            aria-describedby="disasterTypeError"
            required
          >
            <option value="">-- Select Disaster Type --</option>
            {DISASTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {formErrors.disasterType && (
            <p className="error-msg" id="disasterTypeError">
              {formErrors.disasterType}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={formErrors.description ? "true" : "false"}
            aria-describedby="descriptionError"
            placeholder="Describe the disaster in detail"
            required
          />
          {formErrors.description && (
            <p className="error-msg" id="descriptionError">
              {formErrors.description}
            </p>
          )}
        </div>

        {/* Location Map & auto detect */}
        <fieldset className="form-group location-group">
          <legend>Location *</legend>
          <button
            type="button"
            onClick={() => {
              setIsLocating(true);
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setIsLocating(false);
                  },
                  () => {
                    alert("Failed to get location. Please allow location services.");
                    setIsLocating(false);
                  }
                );
              } else {
                alert("Geolocation is not supported by your browser.");
                setIsLocating(false);
              }
            }}
            disabled={isLocating}
            className="btn-secondary"
            aria-live="polite"
          >
            {isLocating ? "Locating..." : "Auto-detect My Location"}
          </button>
          {formErrors.position && (
            <p className="error-msg">{formErrors.position}</p>
          )}
          <MapContainer
            center={position}
            zoom={12}
            className="leaflet-container map-small"
            scrollWheelZoom={false}
            aria-label="Map to select disaster location"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          <p className="location-coords" aria-live="polite">
            Selected location: Latitude {position[0].toFixed(4)}, Longitude{" "}
            {position[1].toFixed(4)}
          </p>
        </fieldset>

        {/* Severity */}
        <div className="form-group">
          <label htmlFor="severity">Severity (1-10) *</label>
          <input
            type="number"
            id="severity"
            min="1"
            max="10"
            step="1"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            aria-invalid={formErrors.severity ? "true" : "false"}
            aria-describedby="severityError"
            required
          />
          {formErrors.severity && (
            <p className="error-msg" id="severityError">
              {formErrors.severity}
            </p>
          )}
        </div>

        {/* File Upload */}
        <div className="form-group">
          <label htmlFor="fileUpload">Upload Photo or Video (optional)</label>
          <input
            type="file"
            id="fileUpload"
            accept="image/*,video/*"
            onChange={onFileChange}
          />
          {filePreviewUrl && (
            <PreviewMedia file={file} url={filePreviewUrl} />
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn-primary submit-btn">
          Submit Report
        </button>
      </form>
    </div>
  );
}

// Component to preview uploaded media (image or video)
function PreviewMedia({ file, url }) {
  const isVideo = file.type.startsWith("video/");

  return (
    <div className="media-preview" aria-live="polite">
      {isVideo ? (
        <video
          src={url}
          controls
          width="320"
          height="240"
          alt="Uploaded video preview"
        />
      ) : (
        <img src={url} alt="Uploaded photo preview" width="320" />
      )}
    </div>
  );
}

export default ReportDisaster;