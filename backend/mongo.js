const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const OpenAI =require("openai");

const app = express();
const port = 3000;
const cors = require("cors");
const uri = "mongodb+srv://vivek:vivek@majorproject.mqt1wvx.mongodb.net/";

app.use(express.json());
// Load environment variables from .env file
require('dotenv').config();

app.use(cors({ origin: "*" })); 
let db;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY, // Use env variable
  dangerouslyAllowBrowser: true,
});

const client = new MongoClient(uri);

client.connect()
    .then(() => {
        db = client.db("Majorproject");
        console.log("✅ Connected to MongoDB Atlas");
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const getCollection = (collectionName) => db.collection(collectionName);

app.post("/upload/Question_paper", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "No text provided" });

        const collection = getCollection("Question_paper");
        const result = await collection.insertOne({ content: text });

        res.json({ message: "✅ Uploaded successfully!", id: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/getQuestionPaper/:id", async (req, res) => {
    try {
        const collection = getCollection("Question_paper");
        const paper = await collection.findOne({ _id: new ObjectId(req.params.id) });
        if (!paper) return res.status(404).json({ error: "Question paper not found!" });

        res.json(paper);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
});


app.post("/uploadKey", async (req, res) => {

  try {
    const { questionPaperId, answer } = req.body;

    if (!questionPaperId || !answer) {
      return res.status(400).json({ error: "Missing questionPaperId or answer" });
    }

    const collection = getCollection("SubmittedAnswers");
    const result = await collection.insertOne({ questionPaperId, answer });

    res.json({
      message: "✅ Answer submitted successfully!",
      id: result.insertedId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/getResults/:q_paper", async (req, res) => {
  const questionPaperId = req.params.q_paper;

  try {
    // 1. Fetch the question paper
    const questionPaperCollection = getCollection("Question_paper");
    const questionPaper = await questionPaperCollection.findOne({ _id: new ObjectId(questionPaperId) });

    if (!questionPaper) {
      return res.status(404).json({ error: "Question paper not found" });
    }

    // 2. Fetch the answer key from "SubmittedAnswers" collection
    const submittedAnswersCollection = getCollection("SubmittedAnswers");
    const answerKeyDoc = await submittedAnswersCollection.findOne({ questionPaperId });

    if (!answerKeyDoc || !answerKeyDoc.answer) {
      return res.status(404).json({ error: "Answer key not found" });
    }

    // Assuming the answer key is an array of correct answers
    const answerKey = Array.isArray(answerKeyDoc.answer)
      ? answerKeyDoc.answer
      : answerKeyDoc.answer.split(','); // If stored as a plain text, split by commas or your delimiter

    // 3. Fetch all student answer sheets
    const examPapersCollection = getCollection("Exam_papers");
    const answerRes = await examPapersCollection.find({ paperId: questionPaperId }).toArray();

    if (!answerRes.length) {
      return res.status(404).json({ error: "No answers submitted" });
    }

    const results = [];

    for (const row of answerRes) {
      let userAnswers = row.answers;  // answers are stored as plain text

      // Ensure answers are plain text strings (not in JSON format)
      if (typeof userAnswers !== 'string') {
        console.warn(`Skipping user ${row.userId}: Invalid answer format - ${userAnswers}`);
        results.push({ userId: row.userId, score: 0, reason: "Invalid answer format" });
        continue;
      }

      // 4. Evaluate the answer by comparing plain text answers with the answer key
      let score = 0;
      let each_score=0;
      try {
        const response = await fetch("http://localhost:5002/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answerKey: answerKey.map(ans => `Ans) ${ans.trim()}`).join(' '),
            userAnswers: `Ans) ${userAnswers.trim()}`
          }),
        });

        const data = await response.json();
        score = data.total_score || 0;
        each_score=data.scores ||0;
      } catch (err) {
        console.error(`Evaluation failed for user ${row.userId}:`, err.message);
      }

      // Store the result
      results.push({ userId: row.userId, score , each_score});
    }

    // Return the result to the user
    res.json({ results });
  } catch (error) {
    console.error("Error in /getResults:", error.message);
    res.status(500).json({ error: error.message });
  }
});





app.post("/submitAnswers", async (req, res) => {
    try {
        const {  userId, paperId, answers } = req.body;
        console.log(req.body);
        console.log("is the requriered body");
        // if (paperId && userId && answers) {
        //      alert("Some fields are missing!");
        //      return;
        // }

        const collection = getCollection("Exam_papers");
        const result = await collection.insertOne({ userId, paperId,answers });

        res.json({ message: "✅ Answers submitted successfully!", id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
