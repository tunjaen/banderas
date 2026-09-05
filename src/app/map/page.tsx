"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/lib/LanguageContext";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false });

interface Progress {
  countryId: string;
  status: string;
  correctAnswers: number;
  wrongAnswers: number;
  country: {
    name: string;
    nameEn: string;
    capital: string;
    capitalEn: string;
    continent: string;
    continentEn: string;
    isoCode: string;
  }
}

function GlobalMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const { t, lang } = useLanguage();
  const [geoData, setGeoData] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [targetUserName, setTargetUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const geoRes = await fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json");
        const geoJson = await geoRes.json();
        
        const newFeatures: any[] = [];
        geoJson.features.forEach((f: any) => {
          if (f.id === "ISR") {
            // Keep Palestine covering main region
            const palestineFeature = {
              ...f,
              id: "PSE",
              properties: { ...f.properties, name: "Palestina" }
            };
            newFeatures.push(palestineFeature);

            // Add a small portion for Israel
            const israelFeature = {
              type: "Feature",
              id: "ISR",
              properties: { name: "Israel" },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [34.8, 31.8],
                  [35.0, 31.8],
                  [35.0, 32.1],
                  [34.8, 32.1],
                  [34.8, 31.8]
                ]]
              }
            };
            newFeatures.push(israelFeature);
          } else {
            newFeatures.push(f);
          }
        });
        geoJson.features = newFeatures;

        setGeoData(geoJson);

        const url = userId ? `/api/stats?userId=${userId}` : "/api/stats";
        const progRes = await fetch(url);
        if (progRes.ok) {
          const progData = await progRes.json();
          const pMap: Record<string, Progress> = {};
          progData.progress.forEach((p: Progress) => {
            pMap[p.countryId] = p;
          });
          setProgress(pMap);
          if (progData.userName && userId) {
            setTargetUserName(progData.userName);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [userId]);

  const [showIslandModal, setShowIslandModal] = useState(false);

  const islandProgressList = Object.values(progress).filter((p: Progress) => p.country?.continent === "Islas");
  const isIslandExpert = islandProgressList.length > 0 && islandProgressList.every((p: Progress) => 
    p.status === "Familiar" || p.status === "Dominado" || p.status === "Experto" || p.status === "MASTERED"
  );

  if (loading) return <div className="container flex justify-center items-center" style={{ minHeight: "100vh" }}>{t.map.loading}</div>;

  // Legend & map color mapping matching Database statuses:
  // DB "Dominado" / "Experto" / "MASTERED" -> Green #10b981 (Experto)
  // DB "Familiar" / "FAMILIAR"               -> Amber #f59e0b (Dominado)
  // DB "Aprendiendo" / "Aprendido"           -> Blue #3b82f6 (Aprendido)
  // DB "Nuevo" / Unseen                      -> Slate #334155 (Por Descubrir)
  const getColor = (status: string) => {
    if (status === "Experto" || status === "Dominado" || status === "MASTERED") return "#10b981"; // Green (Experto)
    if (status === "Familiar" || status === "FAMILIAR") return "#f59e0b"; // Amber (Dominado)
    if (status === "Aprendiendo" || status === "Aprendido" || status === "LEARNING") return "#3b82f6"; // Blue (Aprendido)
    return "#334155"; // Slate (Por Descubrir)
  };

  const getStatusLabel = (status: string) => {
    if (status === "Experto" || status === "Dominado" || status === "MASTERED") return lang === 'en' ? "Expert" : "Experto";
    if (status === "Familiar" || status === "FAMILIAR") return lang === 'en' ? "Dominated" : "Dominado";
    if (status === "Aprendiendo" || status === "Aprendido" || status === "LEARNING") return lang === 'en' ? "Learned" : "Aprendido";
    return lang === 'en' ? "Unseen" : "Por Descubrir";
  };

  const styleFeature = (feature: any) => {
    const p = progress[feature.id];
    return {
      fillColor: p ? getColor(p.status) : "#334155",
      weight: 1,
      opacity: 1,
      color: "rgba(255,255,255,0.2)",
      fillOpacity: 0.75
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const p = progress[feature.id];
    let name = feature.properties.name;
    if (p) name = lang === 'en' ? p.country.nameEn : p.country.name;

    layer.bindTooltip(name, { sticky: true });

    layer.on({
      mouseover: (e: any) => { e.target.setStyle({ fillOpacity: 1, weight: 2 }); },
      mouseout: (e: any) => { e.target.setStyle({ fillOpacity: 0.75, weight: 1 }); }
    });

    if (p) {
      const accuracy = p.correctAnswers + p.wrongAnswers > 0 ? Math.round((p.correctAnswers / (p.correctAnswers + p.wrongAnswers)) * 100) : 0;
      layer.bindPopup(`
        <div style="text-align:center; min-width:150px; color: var(--color-surface);">
          <img src="https://flagcdn.com/w160/${p.country.isoCode}.png" alt="Bandera" style="width:100%; border-radius:4px; margin-bottom:8px;" />
          <h3 style="font-weight:bold; margin-bottom:4px;">${lang === 'en' ? p.country.nameEn : p.country.name}</h3>
          <p style="margin:0; font-size:12px;">${t.quiz.capital}: ${lang === 'en' ? p.country.capitalEn : p.country.capital}</p>
          <hr style="margin:8px 0; border:0; border-top:1px solid #ccc;" />
          <p style="margin:0; font-weight:bold; color:${getColor(p.status)};">${getStatusLabel(p.status)}</p>
          <p style="margin:0; font-size:12px;">${t.map.accuracy}: ${accuracy}% (${p.correctAnswers} / ${p.correctAnswers + p.wrongAnswers})</p>
        </div>
      `);
    } else {
      layer.bindPopup(`
        <div style="text-align:center; color: var(--color-surface);">
          <h3 style="font-weight:bold; margin-bottom:4px;">${name}</h3>
          <p style="margin:0; color:#ef4444;">${lang === 'en' ? "Unseen" : "Por Descubrir"}</p>
        </div>
      `);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Responsive Header */}
      <header 
        style={{ 
          padding: "0.85rem 1.25rem", 
          background: "var(--color-surface)", 
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#fff" }}>
            {targetUserName ? `Mapa de ${targetUserName.split(" ")[0]}` : t.map.title}
          </h1>
          {isIslandExpert && (
            <button
              onClick={() => setShowIslandModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))",
                color: "#F59E0B",
                border: "1px solid #F59E0B",
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: "800",
                cursor: "pointer"
              }}
            >
              <span>🏴‍☠️</span>
              <span>Islas</span>
            </button>
          )}
        </div>

        {/* Legend: Por Descubrir -> Aprendido -> Dominado -> Experto */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem 1rem", fontSize: "0.8rem", fontWeight: "700" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "10px", height: "10px", background: "#334155", borderRadius: "3px" }}></span>
            <span style={{ color: "var(--color-text-muted)" }}>{lang === 'en' ? "Unseen" : "Por Descubrir"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "10px", height: "10px", background: "#3b82f6", borderRadius: "3px" }}></span>
            <span style={{ color: "#60A5FA" }}>{lang === 'en' ? "Learned" : "Aprendido"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "10px", height: "10px", background: "#f59e0b", borderRadius: "3px" }}></span>
            <span style={{ color: "#F59E0B" }}>{lang === 'en' ? "Dominated" : "Dominado"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "3px" }}></span>
            <span style={{ color: "#10B981" }}>{lang === 'en' ? "Expert" : "Experto"}</span>
          </div>
          
          <button 
            onClick={() => userId ? router.back() : router.push("/dashboard")} 
            className="btn btn-outline" 
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
          >
            {t.map.backBtn}
          </button>
        </div>
      </header>

      {/* Map Body */}
      <div style={{ flex: 1, position: "relative" }}>
        {geoData && (
          <MapContainer center={[20, 0]} zoom={2.5} style={{ height: "100%", width: "100%" }}>
            <GeoJSON 
              data={geoData} 
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        )}
      </div>

      {showIslandModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="card animate-scale-up" style={{ maxWidth: "420px", width: "100%", padding: "2rem", textAlign: "center", border: "2px solid #F59E0B", boxShadow: "0 0 35px rgba(245, 158, 11, 0.4)", position: "relative" }}>
            <button 
              onClick={() => setShowIslandModal(false)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
            >
              ✕
            </button>
            <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>🏴‍☠️</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#F59E0B", marginBottom: "0.75rem" }}>
              Cazatesoros de Islas
            </h3>
            <p style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--color-text)", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              ¡Esta persona es una experta cazatesoros en todas las islas del mundo! 🪙💎
            </p>
            <button 
              onClick={() => setShowIslandModal(false)}
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

export default function GlobalMapPage() {
  return (
    <Suspense fallback={<div className="container flex justify-center items-center" style={{ minHeight: "100vh" }}>Cargando mapa...</div>}>
      <GlobalMapContent />
    </Suspense>
  );
}
