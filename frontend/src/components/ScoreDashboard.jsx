import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function ScoreDashboard({ scores }) {
  if (!scores) return null;

  const overallScore = scores.overall_score || 0;

  const metrics = [
    { title: "Communication", score: scores.communication || 0 },
    { title: "Technical Depth", score: scores.technical_depth || 0 },
    { title: "Confidence", score: scores.confidence || 0 },
    { title: "Problem Solving", score: scores.problem_solving || 0 },
  ];

  return (
    <div className="score-dashboard">
      <div className="score-main">
        <div className="score-circle">
          <CircularProgressbar
            value={overallScore}
            text={`${overallScore}%`}
          />
        </div>

        <h2>Overall Interview Score</h2>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div className="metric-card" key={metric.title}>
            <h3>{metric.title}</h3>
            <span>{metric.score}/100</span>
          </div>
        ))}
      </div>
    </div>
  );
}