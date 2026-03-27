import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Minimal OCR diagnostic page.
 * Purpose: prove that capture → OCR → display works without refresh/navigation.
 * No forms, no save logic, no contact creation, no modals.
 */

type Status = "idle" | "compressing" | "scanning" | "done" | "error";

export default function OcrDiagnostic() {
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  const log = useCallback((msg: string) => {
    const ts = new Date().toISOString().slice(11, 23);
    const line = `[${ts}] ${msg}`;
    console.log("[ocr-diag]", msg);
    setLogs((prev) => [...prev, line]);
  }, []);

  // Track renders
  useEffect(() => {
    setRenderCount((c) => c + 1);
  });

  // Mount / unmount / unload tracking
  useEffect(() => {
    mountedRef.current = true;
    log("page mounted");

    const onBeforeUnload = () => log("⚠ beforeunload fired!");
    const onUnload = () => log("⚠ unload fired!");
    const onPageHide = (e: PageTransitionEvent) =>
      log(`⚠ pagehide fired! persisted=${e.persisted}`);

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("unload", onUnload);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      mountedRef.current = false;
      console.log("[ocr-diag] component UNMOUNTED");
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("unload", onUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [log]);

  const compressImage = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        log("compressing image…");
        const img = new Image();
        img.onload = () => {
          const MAX = 1600;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            const ratio = Math.min(MAX / w, MAX / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          log(`compressed: ${dataUrl.length} chars`);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Could not load image"));
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
    },
    [log]
  );

  const runOcr = useCallback(
    async (base64: string) => {
      log("OCR started — calling edge function");
      setStatus("scanning");
      setOcrResult(null);
      setErrorMsg(null);

      try {
        const { data, error } = await supabase.functions.invoke(
          "scan-business-card",
          { body: { image: base64 } }
        );

        if (!mountedRef.current) {
          log("⚠ component unmounted before OCR returned!");
          return;
        }

        if (error) {
          log(`OCR edge function error: ${JSON.stringify(error)}`);
          throw error;
        }
        if (data?.error) {
          log(`OCR returned error: ${data.error}`);
          throw new Error(data.error);
        }

        log("OCR returned data");
        log(`OCR contact: ${JSON.stringify(data?.contact)}`);
        setOcrResult(data?.contact ?? data);
        setStatus("done");
        log("OCR data stored in state");
        log("component still mounted ✓");
      } catch (err: any) {
        log(`OCR FAILED: ${err?.message || err}`);
        setErrorMsg(err?.message || "OCR failed");
        setStatus("error");
      }
    },
    [log]
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      log(`file selected: ${file.name} (${file.type}, ${file.size} bytes)`);
      setFileName(file.name);
      setStatus("compressing");
      setOcrResult(null);
      setErrorMsg(null);

      try {
        const base64 = await compressImage(file);
        log("compression done, starting OCR");
        await runOcr(base64);
      } catch (err: any) {
        log(`file processing error: ${err?.message}`);
        setErrorMsg(err?.message || "Failed to process image");
        setStatus("error");
      }
    },
    [compressImage, runOcr, log]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      log("input onChange fired");
      const file = e.target.files?.[0];
      // Reset input so same file can be re-selected
      e.currentTarget.value = "";
      if (file) {
        void handleFileSelected(file);
      } else {
        log("no file in input change");
      }
    },
    [handleFileSelected, log]
  );

  return (
    <div
      style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}
      onSubmitCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        log("⚠ submit event intercepted and blocked!");
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        OCR Diagnostic (Capture → OCR → Display)
      </h1>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>
        No save logic. No forms. No navigation. Renders: {renderCount}
      </p>

      {/* ── Capture buttons ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            log("camera button clicked");
            cameraRef.current?.click();
          }}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📷 Take Photo
        </button>
        <button
          type="button"
          onClick={() => {
            log("upload button clicked");
            fileRef.current?.click();
          }}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: "#f3f4f6",
            color: "#333",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📁 Upload
        </button>
      </div>

      {/* Hidden file inputs — NOTE: no capture attribute on camera to test if that causes reload */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={onInputChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      {/* ── Status ── */}
      <div
        style={{
          padding: 12,
          background: "#f9fafb",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <div><strong>Status:</strong> {status}</div>
        <div><strong>File:</strong> {fileName || "none"}</div>
        <div><strong>OCR result:</strong> {ocrResult ? "✅ present" : "—"}</div>
        {errorMsg && (
          <div style={{ color: "red", marginTop: 4 }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}
      </div>

      {/* ── Raw OCR result ── */}
      {ocrResult && (
        <div
          style={{
            padding: 12,
            background: "#ecfdf5",
            border: "1px solid #86efac",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <strong style={{ fontSize: 13 }}>Raw OCR Result (stays visible):</strong>
          <pre
            style={{
              fontSize: 11,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              marginTop: 8,
            }}
          >
            {JSON.stringify(ocrResult, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Debug log ── */}
      <div
        style={{
          padding: 12,
          background: "#1e1e1e",
          color: "#a5f3b4",
          borderRadius: 8,
          fontSize: 11,
          fontFamily: "monospace",
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        <strong style={{ color: "#fff" }}>Debug Log:</strong>
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {logs.length === 0 && <div style={{ color: "#666" }}>waiting…</div>}
      </div>
    </div>
  );
}
