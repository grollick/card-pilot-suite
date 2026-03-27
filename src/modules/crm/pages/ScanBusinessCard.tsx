import { useState, useRef, useEffect, useCallback } from "react";

const isoNow = () => new Date().toISOString();

/**
 * Minimal diagnostic scanner page.
 * Purpose: prove that file-select → preview works without browser unload.
 * NO OCR, NO save, NO navigation, NO form wrappers.
 */
export default function ScanBusinessCard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mountCount, setMountCount] = useState(0);
  const [unloadDetected, setUnloadDetected] = useState(false);
  const [unloadPhase, setUnloadPhase] = useState("none");
  const [fileSelectedAt, setFileSelectedAt] = useState("");
  const [previewReadyAt, setPreviewReadyAt] = useState("");
  const mountCountRef = useRef(0);
  const phaseRef = useRef("idle");

  // Mount counter
  useEffect(() => {
    mountCountRef.current += 1;
    setMountCount(mountCountRef.current);

    // Restore previous unload info
    try {
      const prev = sessionStorage.getItem("scan_diag_unload");
      if (prev) {
        setUnloadDetected(true);
        setUnloadPhase(prev);
      }
    } catch {}
  }, []);

  // Unload detection
  useEffect(() => {
    const mark = (evt: string) => {
      const phase = phaseRef.current;
      const info = `${phase} (${evt}) at ${isoNow()}`;
      setUnloadDetected(true);
      setUnloadPhase(info);
      try {
        sessionStorage.setItem("scan_diag_unload", info);
      } catch {}
    };

    const onBU = () => mark("beforeunload");
    const onU = () => mark("unload");
    const onPH = () => mark("pagehide");
    const onVC = () => {
      if (document.visibilityState === "hidden") mark("visibilitychange");
    };

    window.addEventListener("beforeunload", onBU);
    window.addEventListener("unload", onU);
    window.addEventListener("pagehide", onPH);
    document.addEventListener("visibilitychange", onVC);

    return () => {
      window.removeEventListener("beforeunload", onBU);
      window.removeEventListener("unload", onU);
      window.removeEventListener("pagehide", onPH);
      document.removeEventListener("visibilitychange", onVC);
    };
  }, []);

  // Prevent pull-to-refresh
  useEffect(() => {
    const prev = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = "contain";
    document.body.style.overscrollBehaviorY = "contain";
    return () => {
      document.documentElement.style.overscrollBehaviorY = prev;
      document.body.style.overscrollBehaviorY = "";
    };
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    phaseRef.current = "file_selected";
    setFileSelectedAt(isoNow());
    setFile(selected);

    // Generate preview via object URL (safest, no async)
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setPreviewReadyAt(isoNow());
    phaseRef.current = "preview_ready";
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setFileSelectedAt("");
    setPreviewReadyAt("");
    phaseRef.current = "idle";
    try { sessionStorage.removeItem("scan_diag_unload"); } catch {}
    setUnloadDetected(false);
    setUnloadPhase("none");
  }, [previewUrl]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        📷 Scanner Diagnostic — File Input Test
      </h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        Select an image. No OCR, no save, no navigation. Just file → preview.
      </p>

      {/* ── Debug Panel ── */}
      <div style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 12,
        fontFamily: "monospace",
        background: "#f9f9f9",
        lineHeight: 1.8,
      }}>
        <p style={{ fontWeight: 700 }}>🔍 Debug Panel</p>
        <p>Current path: <b>{window.location.pathname}</b></p>
        <p>Mount count: <b>{mountCount}</b></p>
        <p>File selected: <b>{file ? "YES ✅" : "NO"}</b></p>
        <p>File name: <b>{file?.name || "—"}</b></p>
        <p>File size: <b>{file ? `${(file.size / 1024).toFixed(1)} KB` : "—"}</b></p>
        <p>File selected at: <b>{fileSelectedAt || "—"}</b></p>
        <p>Preview generated: <b>{previewUrl ? "YES ✅" : "NO"}</b></p>
        <p>Preview ready at: <b>{previewReadyAt || "—"}</b></p>
        <p>Phase: <b>{phaseRef.current}</b></p>
        <p style={{ color: unloadDetected ? "red" : "green", fontWeight: 700 }}>
          Unload detected: {unloadDetected ? `YES 🔴 — ${unloadPhase}` : "NO ✅"}
        </p>
      </div>

      {/* ── File Input — NO form, NO capture attribute ── */}
      {!file && (
        <div style={{
          border: "2px dashed #ccc",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, marginBottom: 12 }}>Select an image file</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ fontSize: 14 }}
          />
          <p style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
            Plain file input — no capture attribute, no form wrapper
          </p>
        </div>
      )}

      {/* ── Image Preview ── */}
      {previewUrl && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            background: "#e8f5e9",
            border: "1px solid #4caf50",
            borderRadius: 8,
            padding: 8,
            textAlign: "center",
            marginBottom: 8,
          }}>
            <p style={{ fontWeight: 600, color: "#2e7d32", fontSize: 14 }}>
              ✅ Image preview visible
            </p>
          </div>
          <img
            src={previewUrl}
            alt="Selected file preview"
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              fontSize: 14,
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Clear & Try Again
          </button>
        </div>
      )}
    </div>
  );
}
