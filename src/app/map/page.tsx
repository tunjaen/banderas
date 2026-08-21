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
        
        geoJson.features = geoJson.features.map((f: any) => {
          if (f.id === "ISR") {
            f.id = "PSE";
            f.properties.name = "Palestina";
          }
          return f;
        });

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
    p.status === "Familiar" || p.status === "Dominado" || p.status === "FAMILIAR" || p.status === "MASTERED"
  );

  if (loading) return <div className="container flex justify-center items-center" style={{ minHeight: "100vh" }}>{t.map.loading}</div>;

  const getColor = (status: string) => {
    if (status === "Dominado" || status === "MASTERED") return "#10b981";
    if (status === "Familiar" || status === "FAMILIAR") return "#f59e0b";
    if (status === "Aprendiendo" || status === "LEARNING") return "#3b82f6";
    return "#334155";
  };

  const styleFeature = (feature: any) => {
    const p = progress[feature.id];
    return {
      fillColor: p ? getColor(p.status) : "#334155",
      weight: 1,
      opacity: 1,
      color: "rgba(255,255,255,0.2)",
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const p = progress[feature.id];
    let name = feature.properties.name;
    if (p) name = lang === 'en' ? p.country.nameEn : p.country.name;

    layer.bindTooltip(name, { sticky: true });

    layer.on({
      mouseover: (e: any) => { e.target.setStyle({ fillOpacity: 1, weight: 2 }); },
      mouseout: (e: any) => { e.target.setStyle({ fillOpacity: 0.7, weight: 1 }); }
    });

    if (p) {
      const accuracy = p.correctAnswers + p.wrongAnswers > 0 ? Math.round((p.correctAnswers / (p.correctAnswers + p.wrongAnswers)) * 100) : 0;
      layer.bindPopup(`
        <div style="text-align:center; min-width:150px; color: var(--color-surface);">
          <img src="https://flagcdn.com/w160/${p.country.isoCode}.png" alt="Bandera" style="width:100%; border-radius:4px; margin-bottom:8px;" />
          <h3 style="font-weight:bold; margin-bottom:4px;">${lang === 'en' ? p.country.nameEn : p.country.name}</h3>
          <p style="margin:0; font-size:12px;">${t.quiz.capital}: ${lang === 'en' ? p.country.capitalEn : p.country.capital}</p>
          <hr style="margin:8px 0; border:0; border-top:1px solid #ccc;" />
          <p style="margin:0; font-weight:bold; color:${getColor(p.status)};">${t.map[p.status === "Dominado" ? "mastered" : p.status === "Familiar" ? "familiar" : "learning"]}</p>
          <p style="margin:0; font-size:12px;">${t.map.accuracy}: ${accuracy}% (${p.correctAnswers} / ${p.correctAnswers + p.wrongAnswers})</p>
        </div>
      `);
    } else {
      layer.bindPopup(`
        <div style="text-align:center; color: var(--color-surface);">
          <h3 style="font-weight:bold; margin-bottom:4px;">${name}</h3>
          <p style="margin:0; color:#ef4444;">${t.map.notLearned}</p>
        </div>
      `);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="flex justify-between items-center" style={{ padding: "1rem 2rem", background: "var(--color-surface)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>{targetUserName ? `Mapa de ${targetUserName.split(" ")[0]}` : t.map.title}</h1>
          {isIslandExpert && (
            <button
              onClick={() => setShowIslandModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))",
                color: "#F59E0B",
                border: "1px solid #F59E0B",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(245, 158, 11, 0.3)"
              }}
            >
              <span>🏴‍☠️</span>
              <span>Experto en Islas</span>
            </button>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
            <span style={{ width: "12px", height: "12px", background: "#334155", borderRadius: "2px" }}></span> {t.map.notLearned}
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
            <span style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "2px" }}></span> {t.map.learning}
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
            <span style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "2px" }}></span> {t.map.familiar}
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
            <span style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "2px" }}></span> {t.map.mastered}
          </div>
          <button onClick={() => userId ? router.back() : router.push("/dashboard")} className="btn btn-outline" style={{ padding: "0.5rem 1rem", marginLeft: "1rem" }}>{t.map.backBtn}</button>
        </div>
      </header>

      <div style={{ flex: 1, position: "relative" }}>
        {geoData && (
          <MapContainer center={[20, 0]} zoom={3} style={{ height: "100%", width: "100%" }}>
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
