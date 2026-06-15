import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { FaTrash, FaEye, FaTimes } from "react-icons/fa";

const API = "http://127.0.0.1:8000";

export default function InterviewHistory({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/history`);
      setHistory(res.data.history || []);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteHistory = async (id) => {
    if (!window.confirm("Delete this interview history?")) return;

    try {
      await axios.delete(`${API}/history/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setSelectedItem(null);
    } catch {
      alert("Failed to delete history");
    }
  };

  return (
    <div className="history-card">
      <h2>📈 Interview History</h2>

      {history.length === 0 ? (
        <p className="empty-history">No interview history found.</p>
      ) : (
        <div className="history-grid">
          {history.map((item) => (
            <div className="history-item" key={item.id}>
              <h3>{item.resume_name}</h3>

              <p><strong>Date:</strong> {item.created_at}</p>
              <p><strong>Score:</strong> {item.overall_score || 0}/100</p>

              <p className="history-question">
                {item.question?.slice(0, 130)}...
              </p>

              <div className="history-actions">
                <button onClick={() => setSelectedItem(item)}>
                  <FaEye /> View
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteHistory(item.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem &&
        createPortal(
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setSelectedItem(null)}
              >
                <FaTimes />
              </button>

              <div className="modal-content">
                <div className="modal-header">
                  <h2>🎙️ Interview Details</h2>
                  <p>{selectedItem.resume_name}</p>
                </div>

                <div className="modal-score">
                  <span>{selectedItem.overall_score || 0}</span>
                  <p>Overall Score / 100</p>
                </div>

                <div className="modal-meta">
                  <strong>📅 Date:</strong> {selectedItem.created_at}
                </div>

                <div className="modal-section">
                  <h3>❓ Question</h3>
                  <p>{selectedItem.question}</p>
                </div>

                <div className="modal-section">
                  <h3>📝 Answer</h3>
                  <p>{selectedItem.answer}</p>
                </div>

                <div className="modal-section">
                  <h3>⭐ AI Evaluation</h3>
                  <p>{selectedItem.evaluation}</p>
                </div>

                <button
                  className="modal-done-btn"
                  onClick={() => setSelectedItem(null)}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}