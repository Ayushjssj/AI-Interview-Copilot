# 🎙️ AI Interview Copilot

An AI-powered Interview Preparation Platform that helps candidates practice technical, HR, behavioral, and project-based interviews using Generative AI.

The platform analyzes resumes, generates personalized interview questions, evaluates answers, provides detailed feedback, tracks performance, and creates AI-powered learning roadmaps to improve interview readiness.

---

### 🚀 Live Demo

🌐 Frontend: https://ai-interview-copilot-rho.vercel.app/

⚡ Backend API: https://ai-interview-copilot-usjw.onrender.com/

📂 GitHub Repository: https://github.com/Ayushjssj/AI-Interview-Copilot

---

## ✨ Features

### 📄 Resume Analysis

- Upload PDF Resume
- AI-powered Resume Parsing
- Skill Extraction
- Project Analysis
- Strength Identification
- Weakness Detection
- Recommended Career Roles

---

### 🎯 Personalized Interview Questions

Generates:

- Technical Questions
- Project-Based Questions
- HR Questions
- Behavioral Questions
- Problem-Solving Questions

Questions are generated dynamically based on the uploaded resume.

---

### 🎤 Voice Interview Mode

- Speech-to-Text Integration
- Real-Time Voice Answer Capture
- Hands-Free Interview Practice
- Chrome Browser Support

---

### 🤖 Adaptive AI Interviewer

The AI behaves like a real interviewer by:

- Understanding Previous Answers
- Generating Follow-Up Questions
- Creating Multi-Round Interviews
- Evaluating Candidate Thinking Process

---

### 📊 AI Evaluation Engine

Evaluates answers based on:

- Communication Skills
- Technical Knowledge
- Confidence Level
- Problem Solving Ability
- Overall Interview Performance

Provides detailed feedback and suggestions.

---

### 📈 Interview Analytics Dashboard

Track your progress with:

- Performance Graphs
- Score Trends
- Skill Breakdown Charts
- Score Distribution
- AI Readiness Score
- Interview Insights

---

### 📚 AI Learning Roadmap

Generates:

- Weak Area Analysis
- Improvement Suggestions
- Recommended Topics
- Practice Questions
- Personalized Learning Plan
- Interview Preparation Strategy

---

### 🕒 Interview History

- Stores Previous Interviews
- View Detailed Reports
- Track Performance Growth
- Delete Interview Records

---

### 🔐 Authentication System

- User Registration
- Secure Login
- JWT Authentication
- Protected Routes
- Session Management

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- Axios
- React Router
- Recharts
- React Icons
- CSS3

### Backend

- FastAPI
- Python
- Groq API
- Uvicorn
- PyMuPDF
- MongoDB

### AI Technologies

- Groq LLM
- Llama 3
- Generative AI
- Prompt Engineering
- Resume Analysis
- AI Evaluation Engine

### Database

- MongoDB Atlas

### Deployment

- Vercel (Frontend)
- Render (Backend)

---

## 📂 Project Structure

```bash
AI-Interview-Copilot
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── context
│   └── assets
│
├── backend
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── requirements.txt
│   └── uploaded_resumes
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Ayushjssj/AI-Interview-Copilot.git
```

```bash
cd AI-Interview-Copilot
```

---

### Backend Setup

```bash
cd backend
```

```bash
pip install -r requirements.txt
```

Create `.env`

```env
GROQ_API_KEY=your_groq_api_key
MONGO_URL=your_mongodb_connection_string
```

Run Backend

```bash
uvicorn main:app --reload
```

Backend:

```bash
http://127.0.0.1:8000
```

---

### Frontend Setup

```bash
cd frontend
```

```bash
npm install
```

Create `.env`

```env
VITE_API_URL=http://127.0.0.1:8000
```

Run Frontend

```bash
npm run dev
```

Frontend:

```bash
http://localhost:5173
```

---

## 🎯 Future Enhancements

- AI Avatar Interviewer
- Video Interview Analysis
- Webcam Emotion Detection
- Multi-Language Interviews
- Company-Specific Interview Modes
- Coding Round Simulator
- ATS Resume Optimization
- AI Mock Interview Coach

---

## 👨‍💻 Author

### Ayush Pandey

🚀 GenAI Engineer<br>
🛡️ Agentic AI Developer<br>
💻 AI & Full Stack Developer

GitHub:
https://github.com/Ayushjssj

LinkedIn:
https://www.linkedin.com/in/ayush-pandey-a072003p/

Email:
payush1502@gmail.com

---

## ⭐ Support

If you found this project useful:

⭐ Star the Repository

🍴 Fork the Repository

🧠 Contribute New Features

📢 Share with Others

---

## Built with ❤️ by Ayush Pandey
