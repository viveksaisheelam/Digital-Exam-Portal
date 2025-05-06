import React, { useState } from "react";
import "./UploadKey.css"; // We'll create this CSS file
import { FaPaperclip, FaUpload } from "react-icons/fa";

const UploadKey = () => {
  const [questionPaperId, setQuestionPaperId] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = async () => {
    if (!questionPaperId || !answer) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/uploadKey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ questionPaperId, answer })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Answer key submitted successfully!");
        setQuestionPaperId("");
        setAnswer("");
      } else {
        alert(`Failed to submit: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="upload-key-container">
      <div className="upload-key-card">
        <div className="card-header">
          <h2 className="card-title">
            <FaPaperclip className="title-icon" />
            Upload Answer Key
          </h2>
          <p className="card-subtitle">Submit answer key for evaluation</p>
        </div>

        <div className="form-group">
          <label className="input-label">Question Paper ID</label>
          <input
            type="text"
            placeholder="Enter the question paper ID"
            value={questionPaperId}
            onChange={(e) => setQuestionPaperId(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="input-label">Answer Key</label>
          <textarea
            placeholder="Paste the answer key here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="form-textarea"
            rows={8}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="submit-button"
        >
          <FaUpload className="button-icon" />
          Upload Answer Key
        </button>
      </div>
    </div>
  );
};

export default UploadKey;