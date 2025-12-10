import { useState } from "react";
import api from "../api";
import { useParams } from "react-router-dom";

export default function UploadPhotos() {
  const { request_id } = useParams();
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  function handleFileChange(e) {
    setFiles(e.target.files);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();
    for (const file of files) {
      formData.append("photos", file);
    }

    try {
      const res = await api.post(
        `/requests/${request_id}/photos`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || "Upload failed");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Upload Photos for Request #{request_id}</h1>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />

        <br /><br />

        <button type="submit">Upload</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}