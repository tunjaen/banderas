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

    if (cDominated && rDominated) return "#8B5CF6"; // Both dominated (Purple)
    if (cDominated) return "#10B981"; // Challenger (Emerald Green)
    if (rDominated) return "#3B82F6"; // Challenged (Electric Blue)

    if (cHits > 0 && rHits > 0) return "#F59E0B"; // Contested (Amber)
    if (cHits > 0) return "#059669"; // Challenger learning (Dark Emerald)
    if (rHits > 0) return "#2563EB"; // Challenged learning (Dark Blue)

    return "#334155"; // Unclaimed
  };

  const styleFeature = (feature: any) => {
    const countryId = feature.id;
    const color = getFeatureColor(countryId);
    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: "rgba(255,255,255,0.25)",
      fillOpacity: color === "#334155" ? 0.4 : 0.8
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
          🟢 ${challengerName}: <b>${cHits >= 3 ? "DOMINADO (3/3)" : `${cHits}/3 aciertos`}</b>
        </div>
        <div style="font-size: 12px; color: #3B82F6;">
          🔵 ${challengedName}: <b>${rHits >= 3 ? "DOMINADO (3/3)" : `${rHits}/3 aciertos`}</b>
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
      {/* Map Header Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.775rem", fontWeight: "700" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" }}></span>
          <span style={{ color: "#10B981" }}>{challengerName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3B82F6" }}></span>
          <span style={{ color: "#60A5FA" }}>{challengedName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#8B5CF6" }}></span>
          <span style={{ color: "#A78BFA" }}>Ambos Dominan</span>
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
