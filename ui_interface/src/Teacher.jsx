import React, { useState } from "react";
import "./Teacher.css"; // We'll create this CSS file
import CustomizeQuestionPaper from "./CustomizeQuestionPaper1.jsx";
import Results from "./Results.jsx";
import UploadKey from "./UploadKey.jsx";
import { FaFileAlt, FaChartBar, FaKey } from "react-icons/fa";


// Inside your component:

const Teacher = () => {
  const [selectedOption, setSelectedOption] = useState("");

  return (
    <div className="teacher-portal">
      {/* Background decorative elements */}
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>

      <div className="teacher-container">
        {!selectedOption && (
          <div className="portal-header">
            <h1 className="portal-title">
              <span className="title-gradient">Teacher Portal</span>
            </h1>
            <p className="portal-subtitle">Select an option to continue</p>
          </div>
        )}
       
        {!selectedOption && (
          <div className="option-cards">
            <div 
              className="option-card" 
              onClick={() => setSelectedOption("generate")}
            >
              <div className="card-icon generate-icon">
                <FaFileAlt size={28} />
              </div>
              <h3>Generate Question Paper</h3>
              <p>Create customized exam papers</p>
            </div>

            <div 
              className="option-card" 
              onClick={() => setSelectedOption("results")}
            >
              <div className="card-icon results-icon">
                <FaChartBar size={28} />
              </div>
              <h3>View Results</h3>
              <p>Analyze student performance</p>
            </div>

            <div 
              className="option-card" 
              onClick={() => setSelectedOption("uploadkey")}
            >
              <div className="card-icon uploadkey-icon">
                <FaKey size={28} />
              </div>
              <h3>Upload Answer Key</h3>
              <p>Submit exam answer keys</p>
            </div>
          </div>
        )}

        <div className="content-area">
          {selectedOption === "generate" && (
            <>
              <button 
                onClick={() => setSelectedOption("")} 
                className="back-button"
              >
                ← Back to Menu
              </button>
              <CustomizeQuestionPaper />
            </>
          )}

          {selectedOption === "uploadkey" && (
            <>
              <button 
                onClick={() => setSelectedOption("")} 
                className="back-button"
              >
                ← Back to Menu
              </button>
              <UploadKey />
            </>
          )}

          {selectedOption === "results" && (
            <>
              <button 
                onClick={() => setSelectedOption("")} 
                className="back-button"
              >
                ← Back to Menu
              </button>
              <Results />
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Teacher;