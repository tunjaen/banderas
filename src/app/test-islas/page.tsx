"use client";

import { useState } from "react";
import Link from "next/link";
import { FaTimes, FaTrophy } from "react-icons/fa";

export default function TestIslasPage() {
  const [showPirateRain, setShowPirateRain] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const triggerPirateRain = () => {
    setShowPirateRain(true);
    setTimeout(() => {
      setShowPirateRain(false);
    }, 6000);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem 1rem", maxWidth: "800px" }}>
      
      {/* 1. Header Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <Link href="/dashboard" className="btn btn-outline">
          ← Volver al Dashboard
        </Link>
        <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", padding: "0.3rem 0.8rem", borderRadius: "var(--radius-full)", fontWeight: "800", fontSize: "0.85rem", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          🏴‍☠️ Vista Previa Islas
        </span>
      </div>

      <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "800", marginBottom: "0.5rem" }}>
        Demostración de Sección Islas 🏝️
      </h1>
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>
        Prueba interactiva del botón Cazatesoros, animación de victoria 10/10 e insignia de experto pirata.
      </p>

      {/* 2. Pirate Emoji Rain Effect */}
      {showPirateRain && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
          {Array.from({ length: 45 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = 2.5 + Math.random() * 2.5;
            const pirateEmojis = [
              "🪙", "🪙", "🪙", "🪙", "🪙", "🪙", "💰", "💰", "💰", "💰",
              "💀", "☠️", "⚔️", "🧭", "🗺️", "👑", "🍺", "🐒", "🏝️", "🌊", "🏴‍☠️", "💎", "🦜",
              "⛵", "⚓"
            ];
            const pirateEmoji = pirateEmojis[i % pirateEmojis.length];
            return (
              <div 
                key={i}
                style={{
                  position: "absolute",
                  top: "-40px",
                  left: `${left}%`,
                  fontSize: `${1.8 + Math.random() * 1.5}rem`,
                  opacity: 0.95,
                  animation: `pirate-rain-anim ${duration}s linear ${delay}s infinite`
                }}
              >
                {pirateEmoji}
              </div>
            );
          })}
          <style jsx>{`
            @keyframes pirate-rain-anim {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(105vh) rotate(360deg); opacity: 0.2; }
            }
          `}</style>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        
        {/* Component 1: Upgraded Islas Card */}
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem", color: "var(--color-text)" }}>
            1. Botón "Islas" Cazatesoros
          </h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="card hover-scale"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.25rem 1.5rem",
                textAlign: "center",
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "var(--color-text)",
                border: "1px solid rgba(14, 165, 233, 0.5)",
                background: "rgba(14, 165, 233, 0.12)",
                borderRadius: "var(--radius-md)",
                gap: "0.35rem",
                width: "140px"
              }}
            >
              <span style={{ position: "absolute", top: "6px", right: "6px", fontSize: "1.1rem" }}>
                🏴‍☠️
              </span>
              <span style={{ fontSize: "2.2rem" }}>🏝️</span>
              <span style={{ wordBreak: "break-word", lineHeight: "1.2" }}>Islas</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-warning)", fontWeight: "800", marginTop: "-0.1rem" }}>
                Cazatesoros
              </span>
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "1rem" }}>
            Muestra el subtexto dorado <b>Cazatesoros</b> y el icono del cofre pirata en la esquina superior derecha.
          </p>
        </div>

        {/* Component 2: 10/10 Pirate Emoji Rain Trigger */}
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem", color: "var(--color-text)" }}>
            2. Animación Victoria 10/10
          </h2>
          <button 
            onClick={triggerPirateRain}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #F59E0B, #D97706)", border: "none", color: "#FFF", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            🏴‍☠️ Lanzar Lluvia Pirata 10/10
          </button>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "1rem" }}>
            Al acertar 10 de 10 en la ronda de Islas, caen monedas de oro, cofres, palmeras, piratas y tesoros.
          </p>
        </div>

        {/* Component 3: Pirate Expert Badge */}
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem", color: "var(--color-text)" }}>
            3. Insignia en Mapa / Perfil: Experto en Islas
          </h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            
            {/* Clickable Badge */}
            <div 
              onClick={() => setShowBadgeModal(true)}
              className="hover-scale"
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.6rem 1.2rem",
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))",
                border: "2px solid #F59E0B",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🏴‍☠️</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "800", color: "#F59E0B" }}>
                  Experto en Islas
                </span>
                <span style={{ display: "block", fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                  ¡Haz clic para ver insignia!
                </span>
              </div>
            </div>

          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Insignia que aparece al dominar las islas. Al pulsarla abre el modal explicativo.
          </p>
        </div>

      </div>

      {/* 4. Interactive Badge Modal */}
      {showBadgeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="card animate-scale-up" style={{ maxWidth: "420px", width: "100%", padding: "2rem", textAlign: "center", border: "2px solid #F59E0B", boxShadow: "0 0 35px rgba(245, 158, 11, 0.4)", position: "relative" }}>
            
            <button 
              onClick={() => setShowBadgeModal(false)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
            >
              <FaTimes />
            </button>

            <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>
              🏴‍☠️
            </div>
            
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#F59E0B", marginBottom: "0.75rem" }}>
              Cazatesoros de Islas
            </h3>
            
            <p style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--color-text)", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              ¡Esta persona es una experta cazatesoros en todas las islas del mundo! 🪙💎
            </p>

            <button 
              onClick={() => setShowBadgeModal(false)}
              className="btn btn-primary"
              style={{ background: "#F59E0B", color: "#000", fontWeight: "800", width: "100%" }}
            >
              ¡Entendido, Capitán! 🦜
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
