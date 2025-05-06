  import { useState } from "react";
  import OpenAI from "openai";
  import "./CustomizeQuestionPaper.css"; 
  // import { useEffect, useState } from "react";

  const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY;
 console.log(OPENAI_KEY);
 
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_KEY,
    dangerouslyAllowBrowser: true,
  });
  
  export default function CustomizeQuestionPaper() {
    const [syllabusFile, setSyllabusFile] = useState(null);
    const [sections, setSections] = useState([]);
    const [responseText, setResponseText] = useState("");
  
     
    // const [openai, setOpenai] = useState(null);

    // useEffect(() => {
    //   const key = process.env.OPENAI_KEY;
    //   const instance = new OpenAI({
    //     apiKey: key,
    //     dangerouslyAllowBrowser: true, // 🔥 NOT for production
    //   });
    //   setOpenai(instance);
    // }, []);

    const handleFileChange = (e) => {
      setSyllabusFile(e.target.files[0]);
    };
  
    const uploadToDb = async () => {
      if (!responseText || responseText === "Loading.......") {
        alert("⚠️ Question paper is not generated yet!");
        return;
      }
      try {
        const response = await fetch("http://localhost:3000/upload/Question_paper", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: responseText }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          alert(`✅ Successfully uploaded! ID: ${data.id}\nNote: Please save this ID.`);
        } else {
          alert(`❌ Error: ${data.error}`);
        }
      } catch (error) {
        alert("❌ Failed to upload. Check your server.");
        console.error(error);
      }
    };
  
    const handleGenerate = async () => {
      if (!syllabusFile) {
        alert("⚠️ Please select a syllabus file first!");
        return;
      }
      setResponseText("Loading.......");
  
      const formData = new FormData();
      formData.append("file", syllabusFile);
  
      try {
        const response = await fetch("http://127.0.0.1:5002/extract_text", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
        const result = await response.json();
        const extractedSyllabus = result.text;
  
        let formattedSections = sections
          .map(
            (section) =>
              `Section: ${section.name}, Questions: ${section.numQuestions}, Marks: ${section.numMarks}, Type: ${section.questionType}`
          )
          .join("\n");
        console.log(formattedSections);
        const samplePaperFormat = "SREENIDHI INSTITUTE OF SCIENCE AND TECHNOLOGY (SNIST)";
  
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `You are an expert exam paper setter. Generate a clean, well-formatted question paper in plain text, suitable for direct display on a webpage, without using any special symbols (like *, –, #, or bullets). 

The input will be a syllabus copy. Based on that syllabus, create a full-length exam question paper structured into only these sections as mentioned: 

${formattedSections}  

Each question should be relevant to the syllabus content. Number the questions properly (1, 2, 3...) and clearly label each part. Do not include any symbols or markdown. The paper should look clean and readable like a real exam paper.

Input: ${extractedSyllabus} is the syllabus. The paper should cover almost full syllabus from first page to last page.
 `,
            },
          ],
        });
  
        setResponseText(completion.choices[0].message.content);
      } catch (error) {
        console.error("Error generating question paper:", error);
        setResponseText("❌ Failed to generate question paper.");
      }
    };
  
    const addSection = () => {
      setSections([
        ...sections,
        { name: "", numQuestions: 5, numMarks: 10, questionType: "Short Answer" },
      ]);
    };
  
    const removeSection = (index) => {
      setSections(sections.filter((_, i) => i !== index));
    };
  
    const updateSection = (index, field, value) => {
      const newSections = [...sections];
      newSections[index][field] = value;
      setSections(newSections);
    };
  
    return (
      <div className="customize-container">
        <div className="customize-card">
          <div className="card-header">
            <h1 className="header-title">Customize Question Paper</h1>
          </div>
  
          <div className="card-body">
            <div className="upload-container">
              <label className="upload-label">Upload Syllabus</label>
              <div className="file-input-wrapper">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="file-input"
                  id="syllabus-upload"
                />
                <label htmlFor="syllabus-upload" className="file-input-label">
                  Choose File
                </label>
                <span className="file-name">
                  {syllabusFile ? syllabusFile.name : "No file selected"}
                </span>
              </div>
            </div>
  
            <button onClick={addSection} className="add-section-btn">
              + Add Section
            </button>
  
            {sections.map((section, index) => (
              <div className="section-card" key={index}>
                <input
                  type="text"
                  placeholder="Section Name"
                  value={section.name}
                  onChange={(e) => updateSection(index, "name", e.target.value)}
                  className="section-input"
                />
                <div className="section-fields">
                  <div className="input-group">
                    <label className="input-label">Question Type</label>
                    <select
                      value={section.questionType}
                      onChange={(e) => updateSection(index, "questionType", e.target.value)}
                      className="section-select"
                    >
                      <option value="Short Answer">Short Answer</option>
                      <option value="Essay">Essay</option>
                    </select>
                  </div>
  
                  <div className="input-group">
                    <label className="input-label">
                      Number of Questions: <span className="value-display">{section.numQuestions}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={section.numQuestions}
                      onChange={(e) => updateSection(index, "numQuestions", e.target.value)}
                      className="section-range"
                    />
                  </div>
  
                  <div className="input-group">
                    <label className="input-label">
                      Marks Per Question: <span className="value-display">{section.numMarks}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={section.numMarks}
                      onChange={(e) => updateSection(index, "numMarks", e.target.value)}
                      className="section-range"
                    />
                  </div>
  
                  <button 
                    onClick={() => removeSection(index)} 
                    className="remove-section-btn"
                  >
                    Remove Section
                  </button>
                </div>
              </div>
            ))}
  
            <div className="action-buttons">
              <button onClick={handleGenerate} className="generate-btn">
                Generate Question Paper
              </button>
              <button onClick={uploadToDb} className="upload-btn">
                Upload to Database
              </button>
            </div>
  
            {responseText && (
              <div className="response-container">
                <h3 className="response-title">Generated Question Paper</h3>
                <div className="response-content">
                  {responseText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }