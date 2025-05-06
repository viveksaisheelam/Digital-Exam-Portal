from flask import Flask, request, jsonify
import fitz  # PyMuPDF for PDFs
from docx import Document  
import pytesseract  # OCR for Images
from PIL import Image  # Image processing
from flask_cors import CORS
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Function to extract text from TXT files
def extract_text_from_txt(file):
    return file.read().decode("utf-8")

# Function to extract text from PDF files
def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.read(), filetype="pdf")
    return "\n".join([page.get_text() for page in doc])

# Function to extract text from DOCX files
def extract_text_from_docx(file):
    doc = Document(file)
    return "\n".join([para.text for para in doc.paragraphs])

# Function to extract text from Images using OCR
def extract_text_from_image(file):
    image = Image.open(file)
    return pytesseract.image_to_string(image)

@app.route("/extract_text", methods=["POST"])
def extract_text():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    filename = file.filename.lower()

    if filename.endswith(".txt"):
        text = extract_text_from_txt(file)
    elif filename.endswith(".pdf"):
        text = extract_text_from_pdf(file)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(file)
    elif filename.endswith((".png", ".jpg", ".jpeg")):
        text = extract_text_from_image(file)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    return jsonify({"text": text})

def split_into_answers(text):
    return [ans.strip() for ans in text.strip().split("Ans)") if ans.strip()]

@app.route('/evaluate', methods=['POST'])
def evaluate():
    try:
        data = request.get_json()

        answer_key_text = data.get("answerKey", "")
        user_answers_text = data.get("userAnswers", "")

        if not answer_key_text or not user_answers_text:
            return jsonify({"score": 0, "error": "Missing input"}), 400

        answer_key = split_into_answers(answer_key_text)
        user_answers = split_into_answers(user_answers_text)

        if len(answer_key) != len(user_answers):
            return jsonify({
                "score": 0,
                "error": f"Mismatch in number of answers. Expected {len(answer_key)}, got {len(user_answers)}"
            }), 400

        total_score = 0
        scores = []

        for correct, user in zip(answer_key, user_answers):
            if not correct.strip() or not user.strip():
                score = 0.0
            else:
                vectorizer = TfidfVectorizer().fit_transform([correct, user])
                similarity = cosine_similarity(vectorizer[0:1], vectorizer[1:2])[0][0]
                score = round(similarity * 10, 2)
            total_score += score
            scores.append(score)

        return jsonify({
            "total_score": round(total_score, 2),
            "scores": scores
        })

    except Exception as e:
        return jsonify({"score": 0, "error": str(e)}), 500

    
if __name__ == "__main__":
    app.run(debug=True,port=5002)
