import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import MapGL, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const STATIC_CENTER = { lat: 39.8283, lng: -98.5795 };
const STATIC_PIN = { lat: 39.8283, lng: -98.5795, label: "Diagnostic Test Pin" };

const LOCAL_DIAGNOSTIC_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "diagnostic-background",
      type: "background",
      paint: {
        "background-color": "hsl(210, 20%, 94%)",
      },
    },
  ],
};

type DiagnosticStatus = {
  clientMounted: boolean;
  tokenFound: boolean;
  tokenLoaded: boolean;
  providerInitialized: boolean;
  providerFailed: boolean;
  staticCenterApplied: boolean;
  testPinRendered: boolean;
};

function readMapToken() {
  const env = import.meta.env as Record<string, string | undefined>;
  const candidates = [
    { key: "VITE_MAPTILER_KEY", value: env.VITE_MAPTILER_KEY },
    { key: "VITE_MAPBOX_TOKEN", value: env.VITE_MAPBOX_TOKEN },
  ];

  const found = candidates.find((candidate) => Boolean(candidate.value?.trim()));
  return {
    key: found?.key ?? null,
    value: found?.value?.trim() ?? "",
  };
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function OnDutyMapPage() {
  const token = useMemo(() => readMapToken(), []);
  const mapStyle = useMemo(() => {
    if (token.value) {
      return `https://api.maptiler.com/maps/streets/style.json?key=${token.value}`;
    }
    return LOCAL_DIAGNOSTIC_STYLE;
  }, [token.value]);

  const [status, setStatus] = useState<DiagnosticStatus>({
    clientMounted: false,
    tokenFound: Boolean(token.value),
    tokenLoaded: false,
    providerInitialized: false,
    providerFailed: false,
    staticCenterApplied: true,
    testPinRendered: false,
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    console.info("[MapDiagnostic] map component mounted");
    console.info(`[MapDiagnostic] token ${token.value ? "present" : "missing"}`);
    setStatus((prev) => ({
      ...prev,
      clientMounted: true,
      tokenLoaded: Boolean(token.value),
    }));
  }, [token.value]);

  const handleMapLoad = () => {
    console.info("[MapDiagnostic] map initialized");
    console.info("[MapDiagnostic] provider loaded");
    console.info("[MapDiagnostic] test pin rendered");

    setStatus((prev) => ({
      ...prev,
      providerInitialized: true,
      providerFailed: false,
      testPinRendered: true,
    }));
    setErrorMessage("");
  };

  const handleMapError = (event: any) => {
    const message = event?.error?.message ?? "Unknown provider initialization error";
    console.error("[MapDiagnostic] provider failed", message);

    setStatus((prev) => ({
      ...prev,
      providerFailed: true,
      providerInitialized: false,
      testPinRendered: false,
    }));
    setErrorMessage(message);
  };

  return (
    <div className="min-h-screen w-full bg-background overflow-visible">
      <Helmet>
        <title>Map Infrastructure Diagnostic | CardPilot</title>
        <meta
          name="description"
          content="Diagnostic map infrastructure page to validate container visibility, client mount, provider setup, and static pin rendering."
        />
      </Helmet>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Map Infrastructure Diagnostic</h1>

        <section className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-semibold">Map Status Panel</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <StatusRow label="Client mounted" value={status.clientMounted ? "true" : "false"} />
            <StatusRow label="Token status" value={status.tokenFound ? "Token found" : "Token missing"} />
            <StatusRow label="Token loaded at runtime" value={status.tokenLoaded ? "true" : "false"} />
            <StatusRow label="Provider initialized" value={status.providerInitialized ? "true" : "false"} />
            <StatusRow label="Provider failed" value={status.providerFailed ? "true" : "false"} />
            <StatusRow label="Static center applied" value={status.staticCenterApplied ? "true" : "false"} />
            <StatusRow label="Test pin rendered" value={status.testPinRendered ? "true" : "false"} />
            <StatusRow
              label="Token source"
              value={token.key ?? "No token env var found"}
            />
          </div>
        </section>

        <section className="mt-6 w-full">
          <p className="mb-2 text-sm font-semibold text-foreground">Map Diagnostic Container</p>
          <div className="w-full min-h-[500px] rounded-lg border-2 border-border bg-muted/40 p-2">
            {!status.clientMounted ? (
              <div className="flex min-h-[500px] w-full items-center justify-center rounded-md border border-border bg-card">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            ) : status.providerFailed ? (
              <div className="flex min-h-[500px] w-full flex-col items-center justify-center rounded-md border border-border bg-card px-4 text-center">
                <p className="text-base font-semibold text-foreground">Map failed to initialize</p>
                <p className="mt-1 text-xs text-muted-foreground">{errorMessage || "Unknown map error"}</p>
                <div className="mt-4 rounded-md border border-border bg-muted px-4 py-3">
                  <p className="text-sm font-medium text-foreground">Map provider failed — container is working</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[500px] w-full overflow-hidden rounded-md border border-border">
                <MapGL
                  initialViewState={{
                    latitude: STATIC_CENTER.lat,
                    longitude: STATIC_CENTER.lng,
                    zoom: 4,
                  }}
                  mapStyle={mapStyle as any}
                  style={{ width: "100%", minHeight: 500 }}
                  onLoad={handleMapLoad}
                  onError={handleMapError}
                  attributionControl
                >
                  <NavigationControl position="top-right" />

                  <Marker
                    latitude={STATIC_PIN.lat}
                    longitude={STATIC_PIN.lng}
                    anchor="center"
                  >
                    <button
                      type="button"
                      onClick={() => setShowPopup((prev) => !prev)}
                      className="h-4 w-4 rounded-full border-2 border-background bg-primary shadow-card"
                      aria-label="Diagnostic test pin"
                    />
                  </Marker>

                  {showPopup && (
                    <Popup
                      latitude={STATIC_PIN.lat}
                      longitude={STATIC_PIN.lng}
                      closeOnClick={false}
                      closeButton
                      onClose={() => setShowPopup(false)}
                    >
                      {STATIC_PIN.label}
                    </Popup>
                  )}
                </MapGL>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
