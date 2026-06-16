import { useState } from "react";
import axios from "axios";
import { FaMicrophone } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

export default function AdaptiveInterview({ showToast, getAuthHeaders }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [round, setRound] = useState(1);

  const startInterview = () => {
    setQuestion("Tell me about your strongest technical project and your role in it.");
    setAnswer("");
    setContext("");
    setRound(1);
    showToast("🤖 Adaptive interview started!");
  };

  const speakAnswer = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("❌ Voice recognition works best in Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showToast("🎤 Listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      showToast("✅ Voice captured!");
    };

    recognition.onerror = () => {
      showToast("❌ Voice failed.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const getFollowUp = async () => {
    if (!question.trim() || !answer.trim()) {
      showToast("⚠️ Please answer the current question first!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/follow-up-question`,
        {
          question,
          answer,
          interview_context: context,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      const newContext = `
Round ${round}
Question: ${question}
Answer: ${answer}
`;

      setContext((prev) => `${prev}\n${newContext}`);
      setQuestion(res.data.follow_up_question);
      setAnswer("");
      setRound((prev) => prev + 1);

      showToast("➡️ Follow-up question generated!");
    } catch {
      showToast("❌ Follow-up generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setQuestion("");
    setAnswer("");
    setContext("");
    setRound(1);
    showToast("🔁 Adaptive interview reset!");
  };

  return (
    <div className="card wide-card adaptive-card" id="adaptive-interview">
      <div className="card-icon">🤖</div>

      <h2>Adaptive AI Interviewer</h2>
      <p>
        AI asks follow-up questions based on your previous answer, like a real interviewer.
      </p>

      {!question && (
        <button onClick={startInterview}>
          Start Adaptive Interview
        </button>
      )}

      {question && (
        <div className="adaptive-box">
          <div className="adaptive-round">Round {round}</div>

          <h3>AI Question</h3>
          <p className="adaptive-question">{question}</p>

          <textarea
            placeholder="Type your answer here or use voice..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="button-row">
            <button
              className="voice-btn"
              onClick={speakAnswer}
              disabled={loading || isListening}
            >
              <FaMicrophone />
              {isListening ? "Listening..." : "Speak Answer"}
            </button>

            <button onClick={getFollowUp} disabled={loading}>
              Generate Follow-Up
            </button>

            <button onClick={resetInterview}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}