"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false });

interface ChallengeDominationMapProps {
  challengerName: string;
  challengedName: string;
  challengerHits: Record<string, number>;
  challengedHits: Record<string, number>;
  challengerId: string;
  challengedId: string;
}

export default function ChallengeDominationMap({
  challengerName,
  challengedName,
  challengerHits,
  challengedHits,
  challengerId,
  challengedId
}: ChallengeDominationMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading geojson for challenge map:", err);
        setLoading(false);
      });
  }, []);

  const getFeatureColor = (countryId: string) => {
    const cHits = challengerHits[countryId] || 0;
    const rHits = challengedHits[countryId] || 0;

    const cDominated = cHits >= 3;
    const rDominated = rHits >= 3;

    // Fully Dominated (3/3 aciertos) -> Solid Colors
    if (cDominated && rDominated) return "#8B5CF6"; // Both dominated (Purple Solid)
    if (cDominated) return "#10B981"; // Challenger (Emerald Green Solid)
    if (rDominated) return "#3B82F6"; // Challenged (Electric Blue Solid)

    // In Progress (1/3 or 2/3 aciertos) -> SVG Patterns with Gray Background + Color Stripes
    if (cHits > 0 && rHits > 0) return "url(#pattern-both)"; // Both in progress (Gray + Green & Blue stripes)
    if (cHits > 0) return "url(#pattern-challenger)"; // Challenger in progress (Gray + Green stripes)
    if (rHits > 0) return "url(#pattern-challenged)"; // Challenged in progress (Gray + Blue stripes)

    return "#334155"; // Unclaimed (Solid Gray)
  };

  const styleFeature = (feature: any) => {
    const countryId = feature.id;
    const color = getFeatureColor(countryId);
    const isUnclaimed = color === "#334155";
    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: "rgba(255,255,255,0.25)",
      fillOpacity: isUnclaimed ? 0.4 : 0.95
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const countryId = feature.id;
    const name = feature.properties.name || countryId;
    const cHits = challengerHits[countryId] || 0;
    const rHits = challengedHits[countryId] || 0;

    layer.bindTooltip(`${name} (${challengerName}: ${cHits}/3 | ${challengedName}: ${rHits}/3)`, { sticky: true });

    layer.bindPopup(`
      <div style="text-align:center; padding: 4px; min-width: 150px;">
        <h4 style="margin: 0 0 6px 0; font-weight: 800;">${name}</h4>
        <div style="font-size: 12px; margin-bottom: 4px; color: #10B981;">
          🟢 ${challengerName}: <b>${cHits >= 3 ? "DOMINADO (3/3)" : `${cHits}/3 aciertos (En progreso)`}</b>
        </div>
        <div style="font-size: 12px; color: #3B82F6;">
          🔵 ${challengedName}: <b>${rHits >= 3 ? "DOMINADO (3/3)" : `${rHits}/3 aciertos (En progreso)`}</b>
        </div>
      </div>
    `);
  };

  if (loading) {
    return (
      <div style={{ height: "340px", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D1410", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-muted)" }}>
        Cargando mapa de dominación...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* SVG Defs for striped patterns in progress */}
      <svg style={{ height: 0, width: 0, position: "absolute", pointerEvents: "none" }}>
        <defs>
          {/* Pattern Challenger: Gray background + Green diagonal stripes */}
          <pattern id="pattern-challenger" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#334155" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#10B981" strokeWidth="3.5" />
          </pattern>

          {/* Pattern Challenged: Gray background + Blue diagonal stripes */}
          <pattern id="pattern-challenged" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#334155" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#3B82F6" strokeWidth="3.5" />
          </pattern>

          {/* Pattern Both: Gray background + Alternating Green & Blue diagonal stripes */}
          <pattern id="pattern-both" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#334155" />
            <line x1="0" y1="0" x2="0" y2="12" stroke="#10B981" strokeWidth="3" />
            <line x1="6" y1="0" x2="6" y2="12" stroke="#3B82F6" strokeWidth="3" />
          </pattern>
        </defs>
      </svg>

      {/* Map Header Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.775rem", fontWeight: "700" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }} title="3/3 aciertos - Dominado por Challenger">
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" }}></span>
          <span style={{ color: "#10B981" }}>🟢 {challengerName} (Dominado 3/3)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }} title="3/3 aciertos - Dominado por Challenged">
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3B82F6" }}></span>
          <span style={{ color: "#60A5FA" }}>🔵 {challengedName} (Dominado 3/3)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#8B5CF6" }}></span>
          <span style={{ color: "#A78BFA" }}>Ambos Dominan (3/3)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }} title="1/3 o 2/3 aciertos - En progreso">
          <span style={{ width: "14px", height: "10px", borderRadius: "2px", background: "repeating-linear-gradient(45deg, #10B981, #10B981 3px, #334155 3px, #334155 6px)" }}></span>
          <span style={{ color: "#F59E0B" }}>🏁 En Progreso (Rayas 1/3 o 2/3)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#334155" }}></span>
          <span style={{ color: "var(--color-text-muted)" }}>Sin dominar</span>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height: "360px", width: "100%", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
        {geoData && (
          <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
            <GeoJSON 
              data={geoData} 
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        )}
      </div>
    </div>
  );
}
