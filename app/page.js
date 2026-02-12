"use client";

import { useState } from "react";
import Clasificador from "./Clasificador";
import Evaluador from "./Evaluador";

export default function Page() {
  const [activeModule, setActiveModule] = useState("clasificador");
  // valores posibles: "clasificador" | "evaluador"

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        padding: 40,
      }}
    >
      {/* Selector de módulo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          marginBottom: 40,
        }}
      >
        <button
          onClick={() => setActiveModule("clasificador")}
          style={buttonStyle(activeModule === "clasificador")}
        >
          Clasificador IA
        </button>

        <button
          onClick={() => setActiveModule("evaluador")}
          style={buttonStyle(activeModule === "evaluador")}
        >
          Evaluación Visual
        </button>
      </div>

      {/* Render condicional */}
      {activeModule === "clasificador" && <Clasificador />}
      {activeModule === "evaluador" && <Evaluador />}
    </main>
  );
}

/* ================= ESTILO BOTONES ================= */

function buttonStyle(active) {
  return {
    padding: "14px 24px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    background: active ? "#2563eb" : "#334155",
    color: "#ffffff",
    transition: "0.2s ease",
  };
}
