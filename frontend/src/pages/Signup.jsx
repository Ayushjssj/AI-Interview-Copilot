import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSignup = async () => {
    try {
      await axios.post(
        `${API}/signup`,
        form
      );

      alert(
        "Account created successfully"
      );

      navigate("/login");
    } catch (err) {
      alert(
        err?.response?.data?.detail ||
          "Signup failed"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="signup-title">🚀 Create Account</h1>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <button onClick={handleSignup}>
          Create Account
        </button>

        <p>
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}