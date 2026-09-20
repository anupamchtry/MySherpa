"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BatteryMedium, Camera, CameraOff, CheckCircle2, Clock3, LocateFixed, MapPin, RotateCcw, ShieldAlert, Wifi, X } from "lucide-react";
import type { Trek, Warning } from "@/lib/models";

type FieldFix = { latitude: number; longitude: number; accuracyM: number; capturedAt: string; batteryPercent?: number; isDemo?: boolean };
type BatteryManagerLike = { level: number };
type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryManagerLike> };

export function WarningComposer({ trek, online, onClose, onSubmit }: { trek: Trek; online: boolean; onClose: () => void; onSubmit: (warning: Warning) => void }) {
  const [type, setType] = useState<Warning["type"]>("Trail");
  const [severity, setSeverity] = useState<Warning["severity"]>("medium");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [fix, setFix] = useState<FieldFix>();
  const [gpsState, setGpsState] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [gpsError, setGpsError] = useState("");
  const [cameraState, setCameraState] = useState<"closed" | "opening" | "ready" | "error">("closed");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("closed");
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo);
  }, [photo]);

  useEffect(() => {
    if (cameraState !== "ready" || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [cameraState]);

  async function readBattery() {
    try {
      const battery = await (navigator as NavigatorWithBattery).getBattery?.();
      return battery ? Math.round(battery.level * 100) : undefined;
    } catch { return undefined; }
  }

  function getLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("Location is not supported by this browser.")); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }

  async function captureTelemetry(capturedAt = new Date().toISOString()) {
    setGpsState("locating"); setGpsError("");
    try {
      const [position, batteryPercent] = await Promise.all([getLocation(), readBattery()]);
      const nextFix = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyM: Math.round(position.coords.accuracy), capturedAt, batteryPercent };
      setFix(nextFix); setGpsState("ready"); return nextFix;
    } catch (error) {
      setGpsState("error");
      setGpsError(typeof error === "object" && error !== null && "code" in error && (error as GeolocationPositionError).code === 1 ? "Location permission was not allowed." : "Photo saved, but a fresh GPS fix could not be acquired.");
      return undefined;
    }
  }

  async function openCamera() {
    setCameraState("opening"); setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Live camera is unavailable. Use HTTPS on a phone or choose an existing photo.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      setCameraState("ready");
    } catch (error) {
      setCameraState("error");
      setCameraError(error instanceof Error ? error.message : "Camera permission was not available.");
    }
  }

  async function takePhoto() {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const capturedAt = new Date().toISOString();
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", .78));
    stopCamera();
    await captureTelemetry(capturedAt);
  }

  async function selectFallbackPhoto(file?: File) {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
    setPhoto(dataUrl);
    await captureTelemetry(new Date().toISOString());
  }

  async function applyDemoFix() {
    setFix({ latitude: 28.42491, longitude: 83.81372, accuracyM: 7, capturedAt: new Date().toISOString(), batteryPercent: await readBattery() ?? 68, isDemo: true });
    setGpsState("ready"); setGpsError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!fix) { setGpsError("A location snapshot is required before posting."); setGpsState("error"); return; }
    const id = `warning-${Date.now()}`;
    const warning: Warning = {
      id, clientReportId: id, trekId: trek.id, type, title: title.trim(), detail: detail.trim(),
      location: `${fix.latitude.toFixed(5)}, ${fix.longitude.toFixed(5)}`, postedAt: "Just now", author: "Traveller", verified: false, status: "unconfirmed",
      severity, photo, reportCount: 1, dataStatus: "community", source: "Traveller report", createdAt: fix.capturedAt,
      confirmations: [], syncStatus: "pending",
      evidence: photo ? [{ id: `evidence-${Date.now()}`, image: photo, capturedAt: fix.capturedAt, latitude: fix.latitude, longitude: fix.longitude, accuracyM: fix.accuracyM, batteryPercent: fix.batteryPercent, contributor: "Traveller" }] : [],
      point: { latitude: fix.latitude, longitude: fix.longitude },
    };
    stopCamera(); onSubmit(warning);
  }

  return <div className="modal" role="dialog" aria-modal="true" aria-labelledby="warning-composer-title">
    <div className="modal__scrim" onClick={() => { stopCamera(); onClose(); }} />
    <form className="composer field-report" onSubmit={submit}>
      <header className="composer__head"><div><p className="eyebrow">FIELD REPORT</p><h2 id="warning-composer-title">Report a trail hazard</h2><p>Take the evidence photo first. GPS, time and available battery data are attached when the shutter is pressed.</p></div><button type="button" className="icon-button" onClick={() => { stopCamera(); onClose(); }} aria-label="Close"><X /></button></header>
      <div className="privacy-note"><ShieldAlert size={18} /><span>Your coordinates support route safety. The public warning does not expose a device identifier.</span></div>

      <section className="capture-panel capture-panel--camera" aria-labelledby="capture-title">
        <div className="capture-panel__head"><div><strong id="capture-title">1. Capture evidence</strong><span>Use the rear camera for the clearest trail context.</span></div><span className="capture-status"><Wifi size={14} />Saved on device</span></div>
        <canvas ref={canvasRef} className="sr-only" />
        <input ref={fallbackInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => void selectFallbackPhoto(event.target.files?.[0])} />
        {cameraState === "ready" ? <div className="live-camera"><video ref={videoRef} muted playsInline autoPlay aria-label="Live rear camera preview" /><div className="camera-controls"><button type="button" className="camera-cancel" onClick={stopCamera}><CameraOff size={18} />Cancel</button><button type="button" className="camera-shutter" onClick={() => void takePhoto()} aria-label="Take photo"><span /></button><span>GPS attaches now</span></div></div> : photo ? <div className="captured-photo"><img src={photo} alt="New trail hazard evidence" /><div><CheckCircle2 size={17} /><strong>Photo and field data attached</strong><button type="button" onClick={() => { setPhoto(undefined); void openCamera(); }}><RotateCcw size={15} />Retake</button></div></div> : <div className="camera-launch"><button type="button" className="open-camera-button" onClick={() => void openCamera()} disabled={cameraState === "opening"}><Camera size={25} /><span><strong>{cameraState === "opening" ? "Opening camera…" : "Open camera"}</strong><small>Camera permission will be requested</small></span></button><button type="button" className="fallback-photo-button" onClick={() => fallbackInputRef.current?.click()}>Choose existing photo</button></div>}
        {cameraState === "error" && <p className="field-error">{cameraError}</p>}

        <div className="field-fix">
          <div className="field-fix__title"><div><LocateFixed size={18} /><strong>Capture telemetry</strong></div><button type="button" onClick={() => void captureTelemetry()}>{gpsState === "locating" ? "Locating…" : "Refresh location"}</button></div>
          {fix ? <div className="telemetry-grid"><div><MapPin size={16} /><span>Coordinates</span><strong>{fix.latitude.toFixed(5)}, {fix.longitude.toFixed(5)}</strong><small>±{fix.accuracyM} m {fix.isDemo && "· demo fix"}</small></div><div><Clock3 size={16} /><span>Captured</span><strong>{new Date(fix.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong><small>{new Date(fix.capturedAt).toLocaleDateString()}</small></div><div><BatteryMedium size={16} /><span>Battery</span><strong>{fix.batteryPercent == null ? "Unavailable" : `${fix.batteryPercent}%`}</strong><small>{fix.batteryPercent == null ? "Browser restricted" : "At capture time"}</small></div></div> : <div className="no-fix"><MapPin size={20} /><div><strong>{gpsState === "locating" ? "Getting a high-accuracy fix…" : "No location attached yet"}</strong><span>Taking a photo automatically requests a fresh GPS fix.</span></div></div>}
          {gpsState === "error" && <p className="field-error">{gpsError} <button type="button" onClick={() => void applyDemoFix()}>Use a marked demo fix</button></p>}
        </div>
      </section>

      <div className="report-fields"><label>2. Hazard type<select value={type} onChange={(event) => setType(event.target.value as Warning["type"])}><option>Trail</option><option>Landslide</option><option>Bridge</option><option>Weather</option></select></label><label>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as Warning["severity"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Short title<input required maxLength={72} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Fresh rockfall above Sinuwa" /></label></div>
      <label>3. What should the next trekker know?<textarea required rows={3} maxLength={500} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Is the trail passable? Where does the danger begin? Is there local advice?" /></label>
      <div className="composer__actions composer__actions--sticky"><button type="button" className="secondary-button" onClick={() => { stopCamera(); onClose(); }}>Cancel</button><button className="primary-button" disabled={!title.trim() || !detail.trim() || !fix || !photo}>Submit for verification</button></div>
      <small className="composer-disclaimer">{online ? "Saved locally first. Prototype sync does not upload to a real server." : "Saved on this device. This report has not reached other travellers yet."}</small>
    </form>
  </div>;
}
