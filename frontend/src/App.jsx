import { useRef, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import { FaFileUpload, FaCopy, FaCheck, FaMicrophone } from "react-icons/fa";
import { BsQuestionCircleFill } from "react-icons/bs";
import { MdPsychology } from "react-icons/md";
import "./App.css";

import ScoreDashboard from "./components/ScoreDashboard";
import DashboardStats from "./components/DashboardStats";
import InterviewHistory from "./components/InterviewHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./context/AuthContext";

import AdaptiveInterview from "./components/AdaptiveInterview";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

const API = import.meta.env.VITE_API_URL;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [atsReport, setAtsReport] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jdReport, setJdReport] = useState("");
  const [questions, setQuestions] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [roadmap, setRoadmap] = useState("");
  const [readinessReport, setReadinessReport] = useState("");
  const [scores, setScores] = useState(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState("");
  const [resumeDone, setResumeDone] = useState(false);
  const [questionsDone, setQuestionsDone] = useState(false);
  const [evaluationDone, setEvaluationDone] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [currentInterviewAnswer, setCurrentInterviewAnswer] = useState("");
  const [darkMode, setDarkMode] = useState(
  localStorage.getItem("theme") === "dark"
);

useEffect(() => {
  localStorage.setItem("theme", darkMode ? "dark" : "light");
}, [darkMode]);

  const resultsRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const copyToClipboard = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    showToast("✅ Copied to clipboard!");
    setTimeout(() => setCopied(""), 1500);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const parseQuestions = (text) => {
    return text
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 8)
      .filter((q) => /[?]/.test(q) || /^[0-9]/.test(q) || /^[-•]/.test(q));
  };

  const startVoiceAnswer = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("❌ Voice recognition not supported. Use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showToast("🎤 Listening... Speak your answer.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      showToast("✅ Voice converted to text!");
    };

    recognition.onerror = () => {
      showToast("❌ Voice recognition failed. Try again.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const startMockVoiceAnswer = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("❌ Voice recognition not supported. Use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showToast("🎤 Listening for mock interview answer...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCurrentInterviewAnswer((prev) =>
        prev ? `${prev} ${transcript}` : transcript
      );
      showToast("✅ Voice answer captured!");
    };

    recognition.onerror = () => {
      showToast("❌ Voice recognition failed.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const startMockInterview = () => {
    if (!questions) {
      showToast("⚠️ Please generate questions first!");
      return;
    }

    const parsed = parseQuestions(questions);

    if (parsed.length === 0) {
      showToast("⚠️ No valid questions found. Generate again.");
      return;
    }

    setInterviewQuestions(parsed);
    setCurrentQuestionIndex(0);
    setInterviewStarted(true);
    setInterviewAnswers([]);
    setCurrentInterviewAnswer("");
    showToast("🎙️ Mock interview started!");
  };

  const nextInterviewQuestion = () => {
    if (!currentInterviewAnswer.trim()) {
      showToast("⚠️ Please answer the current question first!");
      return;
    }

    const currentQuestion = interviewQuestions[currentQuestionIndex];

    setInterviewAnswers((prev) => [
      ...prev,
      { question: currentQuestion, answer: currentInterviewAnswer },
    ]);

    setCurrentInterviewAnswer("");

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      showToast("➡️ Next question loaded!");
    } else {
      setInterviewStarted(false);
      showToast("✅ Mock interview completed!");
    }
  };

  const restartMockInterview = () => {
    setInterviewAnswers([]);
    setInterviewStarted(false);
    setCurrentQuestionIndex(0);
    setCurrentInterviewAnswer("");
    showToast("🔁 Mock interview reset!");
  };

  const uploadResume = async () => {
    if (!file) {
      showToast("⚠️ Please select resume PDF first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await axios.post(`${API}/upload-resume`, formData, {
        headers: getAuthHeaders(),
      });

      setAnalysis(res.data.analysis);
      setResumeDone(true);
      setAtsReport("");
      setJdReport("");
      showToast("✅ Resume uploaded and analyzed successfully!");
      scrollToResults();
    } catch {
      showToast("❌ Resume upload failed. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const generateATSScore = async () => {
    if (!analysis) {
      showToast("⚠️ Please upload and analyze resume first!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/ats-score`,
        {},
        { headers: getAuthHeaders() }
      );

      setAtsReport(res.data.ats_report);
      showToast("📄 ATS Score generated successfully!");
      scrollToResults();
    } catch {
      showToast("❌ ATS analysis failed. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const generateJDMatch = async () => {
    if (!analysis) {
      showToast("⚠️ Please upload and analyze resume first!");
      return;
    }

    if (!jobDescription.trim()) {
      showToast("⚠️ Please paste a Job Description!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/jd-match`,
        { job_description: jobDescription },
        { headers: getAuthHeaders() }
      );

      setJdReport(res.data.jd_report);
      showToast("🎯 JD Match Analysis Generated!");
      scrollToResults();
    } catch {
      showToast("❌ JD Match Analysis Failed. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/generate-questions`, {
        headers: getAuthHeaders(),
      });

      setQuestions(res.data.questions);
      setQuestionsDone(true);
      setInterviewAnswers([]);
      setInterviewStarted(false);

      showToast("✅ Interview questions generated successfully!");
      scrollToResults();
    } catch {
      showToast("❌ Question generation failed. Please upload resume first.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!selectedQuestion || !answer) {
      showToast("⚠️ Please enter question and answer!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/evaluate-answer`,
        {
          question: selectedQuestion,
          answer,
          resume_name: file?.name || "Unknown Resume",
        },
        { headers: getAuthHeaders() }
      );

      setEvaluation(res.data.evaluation);
      setScores(res.data.scores);
      setRoadmap("");
      setReadinessReport("");
      setEvaluationDone(true);
      setHistoryRefresh((prev) => prev + 1);

      showToast("✅ Answer evaluated and saved to history!");
      scrollToResults();
    } catch {
      showToast("❌ Answer evaluation failed. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateMockInterview = async () => {
    if (interviewAnswers.length === 0) {
      showToast("⚠️ Complete mock interview first!");
      return;
    }

    const combinedQuestion = interviewAnswers
      .map((item, index) => `Q${index + 1}: ${item.question}`)
      .join("\n\n");

    const combinedAnswer = interviewAnswers
      .map((item, index) => `A${index + 1}: ${item.answer}`)
      .join("\n\n");

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/evaluate-answer`,
        {
          question: combinedQuestion,
          answer: combinedAnswer,
          resume_name: file?.name || "Mock Interview",
        },
        { headers: getAuthHeaders() }
      );

      setSelectedQuestion(combinedQuestion);
      setAnswer(combinedAnswer);
      setEvaluation(res.data.evaluation);
      setScores(res.data.scores);
      setRoadmap("");
      setReadinessReport("");
      setEvaluationDone(true);
      setHistoryRefresh((prev) => prev + 1);

      showToast("✅ Full mock interview evaluated!");
      scrollToResults();
    } catch {
      showToast("❌ Mock interview evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    if (!evaluation) {
      showToast("⚠️ Please evaluate an interview first!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/generate-roadmap`,
        { evaluation },
        { headers: getAuthHeaders() }
      );

      setRoadmap(res.data.roadmap);
      setReadinessReport("");
      showToast("🚀 AI Learning Roadmap generated!");
      scrollToResults();
    } catch {
      showToast("❌ Roadmap generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const generateReadinessReport = async () => {
    if (!evaluation) {
      showToast("⚠️ Please evaluate an interview first!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/generate-readiness-report`,
        { evaluation, roadmap },
        { headers: getAuthHeaders() }
      );

      setReadinessReport(res.data.readiness_report);
      showToast("🏆 AI Readiness Report generated!");
      scrollToResults();
    } catch {
      showToast("❌ Readiness report generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (
      !analysis &&
      !questions &&
      !atsReport &&
      !jdReport &&
      !evaluation &&
      !roadmap &&
      !readinessReport &&
      interviewAnswers.length === 0
    ) {
      showToast("⚠️ No report data available yet!");
      return;
    }

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    let y = 15;

    doc.setFontSize(18);
    doc.text("AI Interview Copilot Report", 15, y);

    y += 10;
    doc.setFontSize(10);
    doc.text(`Generated on: ${timestamp}`, 15, y);

    y += 10;
    doc.text(`User: ${user?.name || "User"}`, 15, y);

    y += 10;
    doc.text(`Resume: ${file?.name || "Not available"}`, 15, y);

    const addSection = (title, content) => {
      y += 12;
      doc.setFontSize(14);
      doc.text(title, 15, y);

      y += 8;
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(content || "Not generated yet.", 180);

      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }

        doc.text(line, 15, y);
        y += 6;
      });
    };

    addSection("Resume Analysis", analysis);
    addSection("ATS Resume Score Analysis", atsReport);
    addSection("Resume vs Job Description Match", jdReport);
    addSection("Generated Questions", questions);
    addSection("AI Evaluation", evaluation);
    addSection("AI Learning Roadmap", roadmap);
    addSection("AI Readiness Report", readinessReport);

    doc.save("AI_Interview_Copilot_Report.pdf");
    showToast("✅ Report downloaded successfully!");
  };

  return (
    <div className={`page ${darkMode ? "dark-mode" : ""}`}>
      {toast && <div className="toast">{toast}</div>}

      <nav className="navbar">
        <div className="logo">🎙️ InterviewAI</div>

       <div className="nav-links">
  <a href="#upload">Upload</a>
  <a href="#questions">Questions</a>
  <a href="#analytics">Analytics</a>
  <a href="#jd-match">JD Match</a>
  <a href="#mock-interview">Mock</a>
  <a href="#adaptive-interview">Adaptive</a>
  <a href="#evaluate">Evaluate</a>
  <a href="#results">Results</a>
  <a href="#history">History</a>
</div>

        <div className="user-box">
  <span>👋 {user?.name}</span>

  <button
    className="theme-toggle"
    onClick={() => setDarkMode(!darkMode)}
  >
    {darkMode ? "☀️ Light" : "🌙 Dark"}
  </button>

  <button className="logout-btn" onClick={handleLogout}>
    Logout
  </button>
</div>
      </nav>

      <section className="hero">
        <div className="badge">🚀 AI Interview System</div>
        <h1>AI Interview Copilot</h1>
        <p>
          Resume-based mock interview platform using Groq, FastAPI, React,
          Voice Recognition and AI evaluation.
        </p>

        <div className="hero-stats">
          <div>
            <h3>Resume</h3>
            <span>AI Analysis</span>
          </div>

          <div>
            <h3>Voice</h3>
            <span>Speech to Text</span>
          </div>

          <div>
            <h3>Coach</h3>
            <span>AI Roadmap</span>
          </div>
        </div>
      </section>

      <>
  <DashboardStats refreshKey={historyRefresh} />

  <section id="analytics">
    <AnalyticsDashboard
      refreshKey={historyRefresh}
    />
  </section>
</>

      <main className="dashboard">
        <div className="card" id="upload">
          <div className="card-icon">
            <FaFileUpload />
          </div>

          <h2>1. Upload Resume</h2>
          <p>Upload your resume PDF and get AI-powered profile analysis.</p>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setResumeDone(false);
              setAnalysis("");
              setAtsReport("");
              setJdReport("");
              setJobDescription("");
              setQuestions("");
              setEvaluation("");
              setRoadmap("");
              setReadinessReport("");
              setScores(null);
              setQuestionsDone(false);
              setEvaluationDone(false);
              setInterviewStarted(false);
              setInterviewAnswers([]);
            }}
          />

          {file && <div className="file-name">📄 {file.name}</div>}

          <button onClick={uploadResume} disabled={loading}>
            {resumeDone ? "✓ Resume Analyzed" : "Upload & Analyze"}
          </button>

          <button
            className="ats-btn"
            onClick={generateATSScore}
            disabled={!resumeDone || loading}
          >
            📄 Generate ATS Score
          </button>
        </div>

        <div className="card" id="questions">
          <div className="card-icon">
            <BsQuestionCircleFill />
          </div>

          <h2>2. Generate Questions</h2>
          <p>Generate technical, HR, project-based and behavioral questions.</p>

          <button onClick={generateQuestions} disabled={loading}>
            {questionsDone ? "✓ Questions Generated" : "Generate Questions"}
          </button>
        </div>

        <div className="card wide-card" id="jd-match">
          <div className="card-icon">🎯</div>

          <h2>3. Resume vs JD Match</h2>
          <p>
            Paste a job description and compare it with your resume using AI.
          </p>

          <textarea
            placeholder="Paste Job Description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button
            className="jd-btn"
            onClick={generateJDMatch}
            disabled={!resumeDone || loading}
          >
            🎯 Analyze JD Match
          </button>
        </div>

        <div className="card wide-card" id="mock-interview">
          <div className="card-icon">🎙️</div>

          <h2>4. Mock Interview Mode</h2>
          <p>Start a real interview flow using generated questions.</p>

          {!interviewStarted && interviewAnswers.length === 0 && (
            <button onClick={startMockInterview} disabled={loading}>
              Start Mock Interview
            </button>
          )}

          {interviewStarted && (
            <div className="mock-box">
              <h3>
                Question {currentQuestionIndex + 1} of{" "}
                {interviewQuestions.length}
              </h3>

              <p className="mock-question">
                {interviewQuestions[currentQuestionIndex]}
              </p>

              <textarea
                placeholder="Type your answer here or use voice..."
                value={currentInterviewAnswer}
                onChange={(e) => setCurrentInterviewAnswer(e.target.value)}
              />

              <div className="button-row">
                <button
                  className="voice-btn"
                  onClick={startMockVoiceAnswer}
                  disabled={loading || isListening}
                >
                  <FaMicrophone />
                  {isListening ? "Listening..." : "Speak Answer"}
                </button>

                <button onClick={nextInterviewQuestion}>
                  {currentQuestionIndex === interviewQuestions.length - 1
                    ? "Finish Interview"
                    : "Next Question"}
                </button>
              </div>
            </div>
          )}

          {!interviewStarted && interviewAnswers.length > 0 && (
            <div className="mock-summary">
              <h3>✅ Mock Interview Completed</h3>
              <p>Total Questions Answered: {interviewAnswers.length}</p>

              <div className="button-row">
                <button onClick={evaluateMockInterview} disabled={loading}>
                  Evaluate Full Interview
                </button>

                <button onClick={restartMockInterview}>
                  Restart Interview
                </button>
              </div>
            </div>
          )}
        </div>

        <AdaptiveInterview
  showToast={showToast}
  getAuthHeaders={getAuthHeaders}
/>

        <div className="card wide-card" id="evaluate">
          <div className="card-icon">
            <MdPsychology />
          </div>

          <h2>5. Single Answer Evaluation</h2>

          <textarea
            placeholder="Paste interview question here..."
            value={selectedQuestion}
            onChange={(e) => setSelectedQuestion(e.target.value)}
          />

          <textarea
            placeholder="Type your answer here or use voice input..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="button-row">
            <button
              className="voice-btn"
              onClick={startVoiceAnswer}
              disabled={loading || isListening}
            >
              <FaMicrophone />
              {isListening ? "Listening..." : "Speak Answer"}
            </button>

            <button onClick={evaluateAnswer} disabled={loading}>
              {evaluationDone ? "✓ Answer Evaluated" : "Evaluate Answer"}
            </button>
          </div>
        </div>
      </main>

      {loading && (
        <div className="loading-box">
          <div className="spinner"></div>
          <span>Processing with AI...</span>
        </div>
      )}

      <section className="results" id="results" ref={resultsRef}>
        {(analysis ||
          questions ||
          atsReport ||
          jdReport ||
          evaluation ||
          roadmap ||
          readinessReport) && (
          <button className="download-btn" onClick={downloadReport}>
            ⬇ Download Interview Report
          </button>
        )}

        {analysis && (
          <ResultCard
            title="📌 Resume Analysis"
            content={analysis}
            type="analysis"
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        )}

        {atsReport && (
          <ResultCard
            title="📄 ATS Resume Score Analysis"
            content={atsReport}
            type="ats"
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        )}

        {jdReport && (
          <ResultCard
            title="🎯 Resume vs Job Description Match"
            content={jdReport}
            type="jdmatch"
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        )}

        {questions && (
          <ResultCard
            title="🎯 Generated Questions"
            content={questions}
            type="questions"
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        )}

        {evaluation && (
          <>
            <ScoreDashboard scores={scores} />

            <div className="roadmap-action">
              <button
                className="roadmap-btn"
                onClick={generateRoadmap}
                disabled={loading}
              >
                🚀 Generate Learning Roadmap
              </button>

              <button
                className="readiness-btn"
                onClick={generateReadinessReport}
                disabled={loading}
              >
                🏆 Generate AI Readiness Report
              </button>
            </div>

            <ResultCard
              title="⭐ AI Evaluation"
              content={evaluation}
              type="evaluation"
              copied={copied}
              copyToClipboard={copyToClipboard}
            />
          </>
        )}

        {roadmap && (
          <ResultCard
            title="🧠 AI Learning Roadmap"
            content={roadmap}
            type="roadmap"
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        )}

        {readinessReport && (
          <ResultCard
            title="🏆 AI Readiness Report"
            content={readinessReport}
            type="readiness"
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        )}
      </section>

      <section id="history">
        <InterviewHistory refreshKey={historyRefresh} />
      </section>

      <footer className="footer">
        <div className="footer-card">
          <div className="footer-logo">
            ⚡ Built with ❤️ by <span> Ayush Pandey</span>
          </div>

          <p className="footer-role">
            GenAI Engineer • Agentic AI Developer • Software Developer
          </p>

          <div className="footer-tech">
            ⚡ FastAPI • 🤖 Groq • ⚛️ React • 🎤 Voice AI • 🧠 AI Coach
          </div>

          <div className="footer-divider"></div>

          <p className="footer-copy">
            © 2026 AI Interview Copilot • All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

function ResultCard({ title, content, type, copied, copyToClipboard }) {
  return (
    <div className="result-card">
      <div className="result-header">
        <h2>{title}</h2>

        <button
          className="copy-btn"
          onClick={() => copyToClipboard(content, type)}
        >
          {copied === type ? <FaCheck /> : <FaCopy />}
          {copied === type ? "Copied" : "Copy"}
        </button>
      </div>

      <pre>{content}</pre>
    </div>
  );
}

export default App;