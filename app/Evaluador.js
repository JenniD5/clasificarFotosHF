"use client";

import { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/* ================= TEXTOS ================= */

const FEEDBACK = {
  good: {
    title: "Imagen lista para uso institucional",
    message:
      "La imagen cumple adecuadamente con los lineamientos visuales para su uso en comunicación institucional.",
    tip:
      "Gracias por tu colaboración y por cuidar la presentación visual.",
    color: "#22c55e",
    emoji: "🟢",
  },
  ok: {
    title: "Imagen utilizable con oportunidad de mejora",
    message:
      "La imagen puede utilizarse sin inconvenientes. Con pequeños ajustes en la toma, podría proyectar una imagen aún más clara y profesional.",
    tip:
      "Si tienes oportunidad, intenta una nueva toma procurando una presentación más definida y ordenada.",
    color: "#facc15",
    emoji: "🟡",
  },
  bad: {
    title: "Recomendamos realizar un nuevo intento",
    message:
      "En esta ocasión la imagen no alcanza completamente los lineamientos institucionales para su publicación.",
    tip:
      "Te invitamos a intentar una nueva fotografía. Con una presentación más clara y cuidada, seguramente obtendrás un mejor resultado.",
    color: "#ef4444",
    emoji: "🔴",
  },
};

const FOOTER_MESSAGE =
  "Para orientación adicional sobre lineamientos institucionales, puedes contactar al área correspondiente.";

/* ================= COMPONENTE ================= */

export default function Page() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(true);
  const inputRef = useRef(null);

  /* Animación global */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  async function analyzeImages() {
    if (!window.FaceMesh) {
      alert("FaceMesh aún no ha cargado. Recarga la página.");
      return;
    }

    setLoading(true);
    const analyzed = [];

    for (const file of files) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      await img.decode();

      const mesh = new window.FaceMesh({
        locateFile: (f) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });

      mesh.setOptions({ maxNumFaces: 5, refineLandmarks: true });

      let landmarks = null;
      let faceCount = 0;

      mesh.onResults((r) => {
        if (r.multiFaceLandmarks?.length) {
          faceCount = r.multiFaceLandmarks.length;
          landmarks = r.multiFaceLandmarks[0];
        }
      });

      await mesh.send({ image: img });
      mesh.close();

      const evaluation = landmarks
        ? evaluateImage(landmarks)
        : { level: "ok", percentage: 0.5 };

      analyzed.push({
        file,
        preview: img.src,
        level: evaluation.level,
        percentage: evaluation.percentage,
        isGroup: faceCount > 1,
      });
    }

    setResults(analyzed);
    setLoading(false);
  }

  async function exportZip() {
    const zip = new JSZip();
    const folder = zip.folder("imagenes_aprobadas");

    results
      .filter((r) => r.level !== "bad")
      .forEach((r) => folder.file(r.file.name, r.file));

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "imagenes_aprobadas.zip");
  }

  return (
    <main style={S.page(dark)}>
      <div style={S.wrapper}>
        {/* HEADER */}
        <header style={S.header}>
          <div>
            <h1>Evaluación Visual de Imágenes</h1>
            <p>Herramienta de apoyo para uso institucional</p>
          </div>

          <div style={S.themeSwitch}>
            <span>{dark ? "🌙" : "☀️"}</span>
            <div
              style={{
                ...S.switch,
                background: dark ? "#334155" : "#cbd5e1",
              }}
              onClick={() => setDark(!dark)}
            >
              <div
                style={{
                  ...S.knob,
                  background: dark ? "#0f172a" : "#ffffff",
                  transform: dark ? "translateX(22px)" : "translateX(0px)",
                }}
              />
            </div>
          </div>
        </header>

        {/* HERO CARD */}
        <section style={S.heroCard(dark)}>
          <h2>¿Cómo funciona?</h2>
          <p>
            El sistema revisa automáticamente la imagen para orientar sobre su
            posible uso dentro de la comunicación institucional.
          </p>

          <div style={S.buttonGroup}>
            <button
              style={S.selectBtn}
              onClick={() => inputRef.current.click()}
            >
              Seleccionar imágenes
            </button>

            {files.length > 0 && (
              <button
                onClick={analyzeImages}
                style={S.btn}
                disabled={loading}
              >
                {loading ? "Evaluando…" : "Evaluar imágenes"}
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => {
              setFiles([...e.target.files]);
              setResults([]);
            }}
          />
        </section>

        {/* RESULTADOS */}
        <section style={S.grid}>
          {results.map((r, index) => {
            const f = FEEDBACK[r.level];
            return (
              <div
                key={r.file.name}
                style={{
                  ...S.card(dark),
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <img src={r.preview} style={S.img} alt="" />
                <div style={{ ...S.badge, background: f.color }}>
                  {f.emoji}
                </div>

                <h3>{f.title}</h3>
                <p>{f.message}</p>

                {r.isGroup && (
                  <p style={{ fontStyle: "italic", opacity: 0.8 }}>
                    En fotografías grupales se prioriza que todas las personas
                    se vean claras y visibles.
                  </p>
                )}

                <div style={S.score}>
                  Cumplimiento: {Math.round(r.percentage * 100)}%
                  <div style={S.progressBar(dark)}>
                    <div
                      style={{
                        ...S.progressFill,
                        width: `${r.percentage * 100}%`,
                        background: f.color,
                      }}
                    />
                  </div>
                </div>

                <p style={S.tip}>💬 {f.tip}</p>
                <p style={S.footerNote}>{FOOTER_MESSAGE}</p>
              </div>
            );
          })}
        </section>

        {results.some((r) => r.level !== "bad") && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button onClick={exportZip} style={S.btn}>
              Exportar imágenes aprobadas
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ================= EVALUACIÓN ================= */

function evaluateImage(lm) {
  let score = 0;
  const totalChecks = 3;

  const nose = lm[1];
  if (Math.abs(nose.x - 0.5) < 0.15) score++;

  const l = lm[33];
  const r = lm[263];
  const angle = Math.abs(Math.atan2(r.y - l.y, r.x - l.x));
  if (angle < 0.15) score++;

  const xs = lm.map((p) => p.x);
  const ys = lm.map((p) => p.y);
  const area =
    (Math.max(...xs) - Math.min(...xs)) *
    (Math.max(...ys) - Math.min(...ys));
  if (area > 0.14) score++;

  const percentage = score / totalChecks;

  if (percentage >= 0.7) return { level: "good", percentage };
  if (percentage >= 0.4) return { level: "ok", percentage };
  return { level: "bad", percentage };
}

/* ================= ESTILOS ================= */

const S = {
  page: (dark) => ({
    minHeight: "100vh",
    background: dark
      ? "linear-gradient(135deg, #0f172a, #0b1120)"
      : "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
    color: dark ? "#f8fafc" : "#0f172a",
    display: "flex",
    justifyContent: "center",
    padding: 40,
    fontFamily: "system-ui, sans-serif",
    transition: "all .3s ease",
  }),

  wrapper: {
    width: "100%",
    maxWidth: 1000,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },

  heroCard: (dark) => ({
    background: dark
      ? "rgba(2,6,23,0.75)"
      : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    padding: 40,
    borderRadius: 24,
    textAlign: "center",
    border: dark
      ? "1px solid rgba(255,255,255,0.05)"
      : "1px solid rgba(0,0,0,0.05)",
    boxShadow: dark
      ? "0 10px 40px rgba(0,0,0,0.6)"
      : "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: 40,
  }),

  buttonGroup: {
    marginTop: 25,
    display: "flex",
    gap: 20,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  selectBtn: {
    padding: "14px 30px",
    borderRadius: 14,
    border: 0,
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },

  btn: {
    padding: "14px 30px",
    borderRadius: 14,
    border: 0,
    background: "#334155",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
    gap: 25,
  },

  card: (dark) => ({
    background: dark
      ? "rgba(2,6,23,0.85)"
      : "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    boxShadow: dark
      ? "0 8px 30px rgba(0,0,0,0.6)"
      : "0 8px 25px rgba(0,0,0,0.08)",
    position: "relative",
    animation: "fadeUp .6s ease forwards",
    opacity: 0,
  }),

  img: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    borderRadius: 14,
    marginBottom: 12,
  },

  badge: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },

  progressBar: (dark) => ({
    width: "100%",
    height: 8,
    borderRadius: 8,
    marginTop: 8,
    background: dark ? "#1e293b" : "#e2e8f0",
    overflow: "hidden",
  }),

  progressFill: {
    height: "100%",
    borderRadius: 8,
    transition: "width 1s ease",
  },

  score: { marginTop: 12, fontSize: 13 },

  tip: { marginTop: 10, fontSize: 13, opacity: 0.85 },

  footerNote: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
  },

  themeSwitch: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  switch: {
    width: 46,
    height: 24,
    borderRadius: 999,
    padding: 2,
    cursor: "pointer",
  },

  knob: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    transition: "transform .3s ease",
  },
};
