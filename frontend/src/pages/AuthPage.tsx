import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/AuthPage.css";

interface AuthFormData {
  username?: string;
  email: string;
  password: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await authService.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        if (!formData.username) {
          setError("Ім'я користувача обов'язкове");
          setLoading(false);
          return;
        }
        await authService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      }
      navigate("/rooms");
    } catch (err: any) {
      setError(err.message || "Сталася помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Авторизація</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Ім'я користувача</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username || ""}
                onChange={handleInputChange}
                required={!isLogin}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Електронна пошта</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading
              ? "Завантаження..."
              : isLogin
              ? "Увійти"
              : "Зареєструватися"}
          </button>
        </form>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({ username: "", email: "", password: "" });
            }}
            className="switch-button"
          >
            {isLogin
              ? "Потрібен обліковий запис? Зареєструватися"
              : "Вже маєте обліковий запис? Увійти"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
