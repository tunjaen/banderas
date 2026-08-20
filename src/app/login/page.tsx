"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { FaGlobeAmericas } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          setError(res.error);
        } else {
          router.push("/dashboard");
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al registrarse");
        } else {
          // Auto login after register
          const signInRes = await signIn("credentials", {
            redirect: false,
            email,
            password,
          });
          if (!signInRes?.error) {
            router.push("/dashboard");
          }
        }
      }
    } catch (err) {
      setError(t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ position: "absolute", top: "1rem", right: "2rem" }}>
        <LanguageSelector />
      </div>
      <div className={`card ${styles.authCard} animate-fade-in`}>
        <div className={styles.header}>
          <FaGlobeAmericas size={48} className="text-primary" style={{ margin: "0 auto 1rem" }} />
          <h1 className={styles.title}>{isLogin ? t.auth.loginTitle : t.auth.registerTitle}</h1>
          <p className={styles.subtitle}>
            {isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Nombre (opcional)</label>
              <input
                id="name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>{t.auth.email}</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>{t.auth.password}</label>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.auth.loading : isLogin ? t.auth.submitLogin : t.auth.submitRegister}
          </button>
        </form>

        <p className={styles.toggleText}>
          {isLogin ? `${t.auth.noAccount} ` : `${t.auth.hasAccount} `}
          <span 
            className={styles.toggleLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? t.auth.toRegister : t.auth.toLogin}
          </span>
        </p>
      </div>
    </div>
  );
}
