"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button 
        onClick={() => setLang('es')}
        style={{ 
          background: "transparent", 
          border: "none", 
          cursor: "pointer", 
          opacity: lang === 'es' ? 1 : 0.4,
          padding: "0.25rem",
          transition: "opacity 0.2s"
        }}
        title="Español"
      >
        <img src="https://flagcdn.com/w40/es.png" alt="ES" style={{ width: "24px", borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
      </button>
      <button 
        onClick={() => setLang('en')}
        style={{ 
          background: "transparent", 
          border: "none", 
          cursor: "pointer", 
          opacity: lang === 'en' ? 1 : 0.4,
          padding: "0.25rem",
          transition: "opacity 0.2s"
        }}
        title="English"
      >
        <img src="https://flagcdn.com/w40/gb.png" alt="EN" style={{ width: "24px", borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}
