import React, { useState, useEffect, useRef } from "react";
import { FaClock, FaFileAlt, FaPaperPlane, FaExpand, FaCompress } from "react-icons/fa";
import "./StudentExam.css";

const StudentExam = () => {
  const [paperId, setPaperId] = useState("");
  const [questionPaper, setQuestionPaper] = useState("");
  const [answers, setAnswers] = useState("");
  const [userId, setUserId] = useState("");
  const [timer, setTimer] = useState(1800*3); // Initial value, but timer won't start yet
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerActive, setTimerActive] = useState(false); // New state to control timer activation
  const examContainerRef = useRef(null);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer color based on remaining time
  const getTimerColor = () => {
    if (timer <= 1800 && timer > 300) return "#f59e0b"; // Orange for last 30 minutes (except last 5 mins)
    if (timer <= 300) return "#ef4444"; // Red for last 5 minutes
    return "#10b981"; // Green initially
  };

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timer === 0 && !hasSubmitted && answers.trim()) {
      submitAnswers();
      setHasSubmitted(true);
    }
  }, [timer, hasSubmitted]);

  // Countdown timer - only runs when timerActive is true
  useEffect(() => {
    let countdown;
    if (timerActive) {
      countdown = setInterval(() => {
        setTimer((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [timerActive]);

  // Fullscreen change event handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
      if (!document.fullscreenElement && !hasSubmitted && answers.trim()) {
        submitAnswers();
        setHasSubmitted(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [hasSubmitted, answers]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (examContainerRef.current.requestFullscreen) {
        examContainerRef.current.requestFullscreen().catch(err => {
          alert(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const fetchQuestionPaper = async () => {
    try {
      const response = await fetch(`http://localhost:3000/getQuestionPaper/${paperId}`);
      const data = await response.json();
      if (response.ok) {
        setQuestionPaper(data.content);
        // Start the timer when paper is successfully fetched
        setTimerActive(true);
        // Automatically enter fullscreen
        toggleFullscreen();
      } else {
        alert("❌ Invalid Paper ID");
      }
    } catch (error) {
      console.error("Error fetching question paper:", error);
    }
  };

  const submitAnswers = async () => {
    if (!answers.trim()) {
      alert("⚠️ Please write your answers before submitting.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/submitAnswers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, paperId, answers }),
      });

      if (response.ok) {
        alert("✅ Answers submitted successfully!");
        setPaperId("");
        setQuestionPaper("");
        setAnswers("");
        setUserId("");
        setHasSubmitted(true);
        setTimerActive(false); // Stop the timer after submission
      } else {
        alert("❌ Submission failed.");
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
    }
  };

  return (
    <div className="student-exam-container" ref={examContainerRef}>
      <div className="exam-card">
        <div className="card-header">
          <h2 className="exam-title">
            <FaFileAlt className="title-icon" />
            Student Exam Portal
          </h2>
        </div>
        
        {!isFullscreen && questionPaper && (
          <div className="fullscreen-warning">
            ⚠️ You must enter fullscreen mode to continue with the exam!
          </div>
        )}
        
        <div className="instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Read all questions carefully before answering.</li>
            <li>Type your answers neatly and legibly.</li>
            <li>Strictly Maintain the order give in questionPaper</li>
            <li>Do not use any electronic gadgets during the exam.</li>
            <li><b>Note: All the answers should only be separated using "Ans)"</b></li>
            <li><strong>Important:</strong> Exiting fullscreen mode will automatically submit your answers.</li>
            <li><b>Must fill the username at first.</b>and Timer will start only after fetching the question paper.</li>
          </ul>
        </div>
        
        <div className="timer" style={{ color: getTimerColor() }}>
          <FaClock className="timer-icon" />
          Time Remaining: {formatTime(timer)}
          {!timerActive && questionPaper && (
            <span className="time-warning"> (Timer will start when you enter fullscreen)</span>
          )}
          {timerActive && timer <= 300 && (
            <span className="time-warning"> (Hurry! Time almost up)</span>
          )}
        </div>

        <div className="form-group">
          <label className="input-label">Question Paper ID</label>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Enter the question paper ID"
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              className="form-input"
              disabled={isFullscreen || timerActive}
            />
            <button
              onClick={fetchQuestionPaper}
              className="fetch-button"
              disabled={isFullscreen || timerActive}
            >
              Fetch Paper
            </button>
          </div>
        </div>

        {questionPaper && (
          <div className="question-paper">
            <h3 className="section-title">Question Paper:</h3>
            <div className="paper-content">{questionPaper}</div>
          </div>
        )}

        <div className="form-group">
          <label className="input-label">Your Answers</label>
          <textarea
            placeholder="Write your detailed answers here..."
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            className="answer-textarea"
            rows={10}
          />
        </div>

        <div className="form-group">
          <label className="input-label">Your Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="form-input"
            disabled={isFullscreen || timerActive}
          />
        </div>

        <button
          onClick={submitAnswers}
          disabled={hasSubmitted}
          className={`submit-button ${hasSubmitted ? 'submitted' : ''}`}
        >
          <FaPaperPlane className="button-icon" />
          {hasSubmitted ? 'Answers Submitted' : 'Submit Answers'}
        </button>

        {timerActive && timer <= 300 && (
          <div className="warning-banner">
            Warning: Only {Math.floor(timer/60)} minutes remaining!
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExam;