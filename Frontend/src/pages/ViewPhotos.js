import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function ViewPhotos() {
  const { request_id } = useParams();
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await api.get(`/requests/${request_id}/photos`);
        setPhotos(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Error loading photos");
      }
    }
    fetchPhotos();
  }, [request_id]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Photos for Request #{request_id}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {photos.map((p, index) => (
          <img
            key={index}
            src={`http://localhost:4000/uploads/${p.file_path}`}
            alt="Home"
            style={{
              width: "250px",
              height: "250px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
        ))}
      </div>

      {photos.length === 0 && !error && <p>No photos uploaded yet.</p>}
    </div>
  );
}
