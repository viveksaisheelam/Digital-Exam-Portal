import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Results = () => {
  const [questionPaperId, setQuestionPaperId] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topN, setTopN] = useState(0);
  const [questionWeights, setQuestionWeights] = useState([]);
  const [showWeights, setShowWeights] = useState(false);
  const [weakTopics, setWeakTopics] = useState([]);
  const [maxScore, setMaxScore] = useState(10);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    if (!questionPaperId.trim()) {
      setError("Please enter a valid Question Paper ID.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/getResults/${questionPaperId}`);
      if (!response.ok) {
        throw new Error("Invalid Question Paper ID or No Data Found.");
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error("No results found for this question paper.");
      }

      // Validate each_score exists and is an array
      if (!Array.isArray(data.results[0]?.each_score)) {
        throw new Error("Invalid data format: each_score is missing or not an array");
      }

      const initialWeights = Array(data.results[0].each_score.length).fill(1);
      const sorted = data.results.sort((a, b) => b.score - a.score);
      
      setLeaderboard(sorted);
      setQuestionWeights(initialWeights);
      calculateWeakTopics(sorted);
    } catch (error) {
      console.error("Error fetching results:", error);
      setError(error.message);
      setLeaderboard([]);
      setWeakTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeakTopics = (results) => {
    if (!results || results.length === 0 || !Array.isArray(results[0]?.each_score)) {
      setWeakTopics([]);
      return;
    }
    
    const numQuestions = results[0].each_score.length;
    const totalScores = Array(numQuestions).fill(0);

    results.forEach((entry) => {
      if (Array.isArray(entry.each_score)) {
        entry.each_score.forEach((score, idx) => {
          totalScores[idx] += score;
        });
      }
    });

    const averages = totalScores.map((total) => total / results.length);
    const minAverage = Math.min(...averages);
    const threshold = minAverage + (Math.max(...averages) - minAverage) * 0.3;

    const weak = averages
      .map((avg, idx) => ({ avg, idx }))
      .filter((q) => q.avg < threshold)
      .map((q) => `Q${q.idx + 1}`);

    setWeakTopics(weak);
  };

  const applyWeights = () => {
    const updated = leaderboard.map((entry) => {
      const newScore = Array.isArray(entry.each_score) 
        ? entry.each_score.reduce((sum, val, idx) => {
            const weight = questionWeights[idx] || 1;
            return sum + (val * weight);
          }, 0)
        : 0;
      return { ...entry, score: newScore };
    });

    const sorted = updated.sort((a, b) => b.score - a.score);
    setLeaderboard(sorted);
    calculateWeakTopics(sorted);
  };

  const exportToCSV = () => {
    if (leaderboard.length === 0 || !Array.isArray(leaderboard[0]?.each_score)) return;
    
    const headers = [
      "Rank",
      "User ID",
      ...leaderboard[0].each_score.map((_, i) => `Q${i + 1}`),
      "Total Score",
      "Percentage",
    ];
    
    const totalMaxMarks = questionWeights.reduce((sum, weight, idx) => {
      return sum + (weight * maxScore);
    }, 0);

    const rows = leaderboard.map((entry, index) => [
      index + 1,
      entry.userId,
      ...(Array.isArray(entry.each_score) ? entry.each_score : []),
      entry.score.toFixed(2),
      totalMaxMarks > 0 ? ((entry.score / totalMaxMarks) * 100).toFixed(2) + "%" : "0%",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `exam_results_${questionPaperId}.csv`;
    link.click();
  };

  const filteredLeaderboard = topN > 0 ? leaderboard.slice(0, topN) : leaderboard;

  const chartData = {
    labels: filteredLeaderboard.map((entry) => entry.userId),
    datasets: [
      {
        label: "Score",
        data: filteredLeaderboard.map((entry) => entry.score),
        backgroundColor: "#4caf50",
      },
    ],
  };

  useEffect(() => {
    setTopN(0);
  }, [leaderboard]);

  return (
    <div style={styles.container}>
      <h1>Exam Results</h1>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Enter Question Paper ID"
          value={questionPaperId}
          onChange={(e) => setQuestionPaperId(e.target.value)}
          style={styles.input}
        />
        <button 
          onClick={fetchResults} 
          style={styles.button} 
          disabled={loading}
        >
          {loading ? "Processing..." : "Get Results"}
        </button>
      </div>

      {leaderboard.length > 0 && (
        <div style={styles.leaderboard}>
          <div style={styles.controls}>
            <button onClick={exportToCSV} style={styles.secondaryButton}>
              Export to CSV
            </button>
            <input
              type="number"
              placeholder="Top N Students"
              value={topN || ""}
              min="1"
              max={leaderboard.length}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setTopN(value > 0 ? Math.min(value, leaderboard.length) : 0);
              }}
              style={styles.inputSmall}
            />
            <button onClick={() => window.print()} style={styles.secondaryButton}>
              Print
            </button>
            <button 
              onClick={() => setShowWeights(!showWeights)} 
              style={styles.secondaryButton}
            >
              {showWeights ? "Hide Weights" : "Set Question Weights"}
            </button>
          </div>

          {showWeights && (
            <div style={styles.weightsContainer}>
              <h4>Question Weights (Marks per Question):</h4>
              <div style={styles.maxScoreContainer}>
                <label>Max Score per Question:</label>
                <input
                  type="number"
                  min="1"
                  style={styles.inputSmall}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div style={styles.weightsGrid}>
                {questionWeights.map((weight, idx) => (
                  <div key={idx} style={styles.weightInput}>
                    <label>Q{idx + 1}:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      style={styles.inputTiny}
                      value={weight}
                      onChange={(e) => {
                        const newWeights = [...questionWeights];
                        newWeights[idx] = Math.max(0, Number(e.target.value));
                        setQuestionWeights(newWeights);
                      }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={applyWeights} style={styles.button}>
                Apply Weights
              </button>
            </div>
          )}

          <h2>Leaderboard</h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User ID</th>
                  {Array.isArray(leaderboard[0]?.each_score) && 
                    leaderboard[0].each_score.map((_, i) => (
                      <th key={`Q${i + 1}`}>Q{i + 1}</th>
                    ))}
                  <th>Total Score</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((entry, index) => {
                  const totalMax = questionWeights.reduce((sum, weight) => sum + (weight * maxScore), 0);
                  const percentage = totalMax > 0 ? (entry.score / totalMax) * 100 : 0;
                  
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{entry.userId}</td>
                      {Array.isArray(entry.each_score) ? 
                        entry.each_score.map((score, idx) => (
                          <td key={idx}>{score.toFixed(2)}</td>
                        )) : 
                        <td colSpan={questionWeights.length}>No score data</td>
                      }
                      <td>{entry.score.toFixed(2)}</td>
                      <td>{percentage.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={styles.chartContainer}>
            <h3>Score Distribution</h3>
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Student Scores',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Score',
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Student ID',
                    }
                  }
                }
              }}
            />
          </div>

          {weakTopics.length > 0 && (
            <div style={styles.weakTopics}>
              <h3 style={{ color: "#e53935" }}>Areas Needing Improvement:</h3>
              <ul style={styles.topicList}>
                {weakTopics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { 
    textAlign: "center", 
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif"
  },
  error: {
    color: "#d32f2f",
    backgroundColor: "#ffebee",
    padding: "10px",
    borderRadius: "4px",
    margin: "10px 0"
  },
  inputContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "20px 0",
    flexWrap: "wrap"
  },
  input: { 
    padding: "10px", 
    margin: "10px", 
    width: "300px",
    borderRadius: "4px",
    border: "1px solid #ddd"
  },
  inputSmall: { 
    padding: "8px", 
    margin: "5px", 
    width: "100px",
    borderRadius: "4px",
    border: "1px solid #ddd"
  },
  inputTiny: {
    padding: "5px",
    margin: "2px",
    width: "60px",
    borderRadius: "4px",
    border: "1px solid #ddd"
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    margin: "5px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#1565c0"
    }
  },
  secondaryButton: {
    padding: "8px 16px",
    backgroundColor: "#388e3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    margin: "5px",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#2e7d32"
    }
  },
  leaderboard: { 
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "20px"
  },
  weightsContainer: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
    margin: "15px 0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  weightsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "10px",
    margin: "15px 0"
  },
  weightInput: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  maxScoreContainer: {
    margin: "10px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  tableContainer: {
    overflowX: "auto",
    margin: "20px 0"
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse",
    margin: "20px 0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  chartContainer: {
    margin: "30px 0",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  weakTopics: {
    margin: "20px 0",
    padding: "15px",
    backgroundColor: "#ffebee",
    borderRadius: "8px"
  },
  topicList: {
    listStyleType: "none",
    padding: 0,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px"
  }
};

export default Results;