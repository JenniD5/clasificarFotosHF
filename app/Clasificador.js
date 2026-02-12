"use client";
import { useState } from "react";

import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Home() {
  const [classified, setClassified] = useState({ con: [], sin: [] });
  const [loading, setLoading] = useState(false);

  async function analyze(files) {
    setLoading(true);

    const withFeatures = [];
    const withoutFeatures = [];

    for (const file of files) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      await img.decode();

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({ refineLandmarks: true });

      let detected = false;

      faceMesh.onResults((res) => {
        if (res.multiFaceLandmarks?.length) {
          detected = true;
        }
      });

      await faceMesh.send({ image: img });

      if (detected) withFeatures.push(file);
      else withoutFeatures.push(file);
    }

    setClassified({ con: withFeatures, sin: withoutFeatures });
    setLoading(false);
  }

  async function exportZip() {
    const zip = new JSZip();
    const conFolder = zip.folder("con_maquillaje_o_joyeria");
    const sinFolder = zip.folder("sin_maquillaje_ni_joyeria");

    for (const f of classified.con) {
      conFolder.file(f.name, f);
    }
    for (const f of classified.sin) {
      sinFolder.file(f.name, f);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "imagenes_clasificadas.zip");
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Clasificador Visual IA</h1>
          <p style={styles.subtitle}>
            Evaluación automática de imágenes con MediaPipe
          </p>
        </div>
      </header>

      {/* Upload Section */}
      <section style={styles.uploadSection}>
        <label style={styles.uploadBox}>
          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => analyze(e.target.files)}
          />
          {loading ? "Analizando imágenes..." : "Seleccionar imágenes"}
        </label>
      </section>

      {/* Results */}
      <section style={styles.resultsContainer}>
        <ResultBlock
          title="Con maquillaje o joyería"
          color="#16a34a"
          files={classified.con}
        />

        <ResultBlock
          title="Sin maquillaje ni joyería"
          color="#dc2626"
          files={classified.sin}
        />
      </section>

      {(classified.con.length > 0 || classified.sin.length > 0) && (
        <button onClick={exportZip} style={styles.exportBtn}>
          Exportar ZIP
        </button>
      )}
    </div>
  );
}

/* ---------------- COMPONENTE RESULTADO ---------------- */

function ResultBlock({ title, files, color }) {
  return (
    <div style={styles.resultCard}>
      <h3 style={{ ...styles.resultTitle, borderLeft: `6px solid ${color}` }}>
        {title}
      </h3>

      {files.length === 0 ? (
        <p style={styles.emptyText}>Sin imágenes clasificadas</p>
      ) : (
        <div style={styles.thumbnailGrid}>
          {files.map((file) => (
            <div key={file.name} style={styles.thumbnailCard}>
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={styles.thumbnail}
              />
              <div
                style={{
                  ...styles.badge,
                  background: color,
                }}
              >
                {title.includes("Con") ? "Detectado" : "No detectado"}
              </div>
              <p style={styles.fileName}>{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- ESTILOS ---------------- */

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "40px 20px",
    fontFamily: "system-ui, sans-serif"
  },

  header: {
    maxWidth: 1200,
    margin: "0 auto 40px auto",
    background: "#ffffff",
    padding: 30,
    borderRadius: 14,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 600,
    color: "#111827"
  },

  subtitle: {
    marginTop: 8,
    color: "#6b7280"
  },

  uploadSection: {
    maxWidth: 1200,
    margin: "0 auto 40px auto",
    textAlign: "center"
  },

  uploadBox: {
    display: "inline-block",
    padding: "14px 28px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500,
    transition: "0.2s",
    boxShadow: "0 6px 16px rgba(37,99,235,.25)"
  },

  resultsContainer: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 30
  },

  resultCard: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)"
  },

  resultTitle: {
    marginBottom: 20,
    paddingLeft: 10,
    fontSize: 18
  },

  thumbnailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 15
  },

  thumbnailCard: {
    background: "#f9fafb",
    borderRadius: 10,
    padding: 10,
    textAlign: "center",
    position: "relative"
  },

  thumbnail: {
    width: "100%",
    height: 100,
    objectFit: "cover",
    borderRadius: 8
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    color: "#fff",
    padding: "4px 8px",
    fontSize: 11,
    borderRadius: 6
  },

  fileName: {
    fontSize: 12,
    marginTop: 8,
    color: "#374151",
    wordBreak: "break-word"
  },

  emptyText: {
    color: "#9ca3af",
    fontSize: 14
  },

  exportBtn: {
    marginTop: 40,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "14px 26px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500
  }
};
