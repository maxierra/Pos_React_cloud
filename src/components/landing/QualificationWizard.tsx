"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { BUSINESS_TYPES, type BusinessType, type IntentOption, type PcOption, type ReaderOption } from "@/lib/leads/types";
import { readLeadAttribution } from "@/lib/leads/utm";
import { trackFunnelEvent } from "@/lib/leads/analytics";

type Answers = { businessType?: BusinessType; pcStatus?: PcOption; readerStatus?: ReaderOption; intent?: IntentOption; fullName: string; whatsapp: string; locality: string; consent: boolean };
const INITIAL: Answers = { fullName: "", whatsapp: "", locality: "", consent: false };
const PC = [["windows", "Sí, tengo PC con Windows"], ["no_pc", "No tengo computadora"], ["unsure", "No estoy seguro"]] as const;
const READER = [["yes", "Sí"], ["no", "No"], ["want_one", "Quiero incorporar uno"]] as const;
const INTENT = [["implement", "Quiero implementarlo en mi comercio"], ["replace", "Quiero reemplazar mi sistema actual"], ["learn", "Quiero conocer cómo funciona"], ["browsing", "Solo estoy averiguando"]] as const;

function normalizeArgentinePhone(raw: string) {
  let value = raw.replace(/\D/g, "");
  if (value.startsWith("00")) value = value.slice(2);
  if (value.startsWith("54")) value = value.slice(2);
  if (value.startsWith("0")) value = value.slice(1);
  if (value.length === 12 && value.slice(2, 4) === "15") value = value.slice(0, 2) + value.slice(4);
  return value.length === 10 ? `549${value}` : "";
}

function dateKey(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function availableDays() { const result: string[] = []; const d = new Date(); d.setDate(d.getDate() + 1); while (result.length < 10) { if (d.getDay() >= 1 && d.getDay() <= 5) result.push(dateKey(d)); d.setDate(d.getDate() + 1); } return result; }
function labelDay(key: string) { return new Date(`${key}T12:00:00-03:00`).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }); }
function waUrl(a: Answers, slot: string) { const date = labelDay(slot.slice(0, 10)); const time = slot.slice(11, 16); const message = `Hola, soy ${a.fullName}. Completé la solicitud para implementar Tienda360 en mi ${a.businessType?.toLowerCase()}. Elegí el día ${date} a las ${time}.`; return `https://wa.me/5491123145742?text=${encodeURIComponent(message)}`; }

function Options<T extends string>({ items, value, onChange }: { items: readonly (readonly [T, string])[]; value?: T; onChange: (v: T) => void }) {
  return <div className="t360-options">{items.map(([key,label]) => <button key={key} type="button" className={value === key ? "selected" : ""} onClick={() => onChange(key)}>{value === key && <Check aria-hidden />}<span>{label}</span></button>)}</div>;
}

export function QualificationWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const [step, setStep] = useState(1); const [answers, setAnswers] = useState<Answers>(INITIAL); const [leadId, setLeadId] = useState(""); const [classification, setClassification] = useState(""); const [booked, setBooked] = useState<string[]>([]); const [day, setDay] = useState(""); const [slot, setSlot] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); if (!open && dialog.current?.open) dialog.current.close(); }, [open]);
  const close = () => { dialog.current?.close(); onClose(); };
  const days = useMemo(() => availableDays(), []); const update = <K extends keyof Answers>(key: K, value: Answers[K]) => { setAnswers(a => ({ ...a, [key]: value })); setError(""); };
  const next = () => { const valid = step === 1 ? answers.businessType : step === 2 ? answers.pcStatus : step === 3 ? answers.readerStatus : answers.intent; if (!valid) return setError("Elegí una opción para continuar."); setStep(s => s + 1); setError(""); };

  async function submitLead() {
    const phone = normalizeArgentinePhone(answers.whatsapp);
    if (answers.fullName.trim().length < 2 || answers.locality.trim().length < 2 || !phone || !answers.consent) return setError(!phone ? "Ingresá un WhatsApp argentino válido, con código de área." : "Completá los datos y aceptá el contacto para continuar.");
    setBusy(true); setError("");
    const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...answers, fullName: answers.fullName.trim(), locality: answers.locality.trim(), whatsapp: phone, attribution: readLeadAttribution() }) });
    const data = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setError(data.error || "No pudimos guardar la solicitud.");
    setLeadId(data.id); setClassification(data.classification); trackFunnelEvent("qualification_completed", { classification: data.classification });
    if (answers.intent === "browsing") { setStep(7); return; }
    trackFunnelEvent("qualified_lead", { classification: data.classification }); trackFunnelEvent("schedule_started");
    const availability = await fetch("/api/leads").then(r => r.json()).catch(() => ({ booked: [] })); setBooked(availability.booked ?? []); setStep(6);
  }

  async function reserve() {
    if (!slot) return setError("Elegí un horario para continuar."); setBusy(true); setError("");
    const response = await fetch("/api/leads", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ leadId, scheduledAt: slot }) });
    const data = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(data.error || "No pudimos reservar el turno."); if (response.status === 409) setBooked(x => [...x, slot]); return; }
    trackFunnelEvent("schedule_completed", { classification }); setStep(8);
  }

  const title = step === 1 ? "¿Qué tipo de comercio tenés?" : step === 2 ? "¿Ya tenés una computadora para usar Tienda360?" : step === 3 ? "¿Usás lector de códigos de barras?" : step === 4 ? "¿Qué estás buscando?" : step === 5 ? "¿Cómo te contactamos?" : "";
  return <dialog ref={dialog} className="t360-wizard" onCancel={(e) => { e.preventDefault(); close(); }} onClose={onClose}><div className="t360-wizard-shell">
    <button className="t360-close" onClick={close} aria-label="Cerrar"><X /></button>
    {step <= 5 && <><div className="t360-progress"><span>Paso {step} de 5</span><div>{[1,2,3,4,5].map(n => <i className={n <= step ? "active" : ""} key={n} />)}</div></div><div className="t360-wizard-copy"><p className="t360-kicker">Conozcamos tu comercio</p><h2>{title}</h2>{step === 2 && <p>No te descartamos si todavía no tenés PC: podemos conversar otras opciones.</p>}</div></>}
    <div className="t360-wizard-body">
      {step === 1 && <Options items={BUSINESS_TYPES.map(x => [x,x] as const)} value={answers.businessType} onChange={v => update("businessType", v)} />}
      {step === 2 && <Options items={PC} value={answers.pcStatus} onChange={v => update("pcStatus", v)} />}
      {step === 3 && <Options items={READER} value={answers.readerStatus} onChange={v => update("readerStatus", v)} />}
      {step === 4 && <Options items={INTENT} value={answers.intent} onChange={v => update("intent", v)} />}
      {step === 5 && <div className="t360-fields"><label>Nombre<input autoComplete="name" value={answers.fullName} onChange={e => update("fullName", e.target.value)} /></label><label>WhatsApp<input inputMode="tel" autoComplete="tel" placeholder="Ej. 11 2345 6789" value={answers.whatsapp} onChange={e => update("whatsapp", e.target.value)} /></label><label>Localidad<input autoComplete="address-level2" value={answers.locality} onChange={e => update("locality", e.target.value)} /></label><label className="t360-consent"><input type="checkbox" checked={answers.consent} onChange={e => update("consent", e.target.checked)} /><span>Quiero que me contacten para coordinar una demostración/instalación de Tienda360.</span></label></div>}
      {step === 6 && <div className="t360-scheduler"><p className="t360-kicker">Agenda</p><h2>Elegí cuándo querés que te ayudemos a instalar Tienda360</h2><p>Lunes a viernes, de 10:00 a 18:00.</p><h3>Día</h3><div className="t360-days">{days.map(d => <button className={day === d ? "selected" : ""} key={d} onClick={() => { setDay(d); setSlot(""); }}>{labelDay(d)}</button>)}</div>{day && <><h3>Horario</h3><div className="t360-times">{Array.from({ length: 8 }, (_,i) => `${String(10+i).padStart(2,"0")}:00`).map(t => { const value = `${day}T${t}:00-03:00`; const unavailable = booked.includes(new Date(value).toISOString()) || booked.includes(value); return <button disabled={unavailable} className={slot === value ? "selected" : ""} key={t} onClick={() => setSlot(value)}>{t}{unavailable ? " · Ocupado" : ""}</button> })}</div></>}</div>}
      {step === 7 && <div className="t360-result"><span className="t360-result-icon">i</span><h2>Podés conocer Tienda360 antes de decidir.</h2><p>Guardamos tu consulta. Mientras tanto podés mirar el producto sin ocupar un turno de instalación.</p><div className="t360-result-actions"><a className="t360-button" href="#demo" onClick={close}>Ver demostración</a><a className="t360-button t360-button-ghost" href="#funciones" onClick={close}>Ver funciones</a><a className="t360-text-link" href="https://www.youtube.com/@Tienda360" target="_blank" rel="noreferrer">Ver tutoriales ↗</a><a className="t360-text-link" href="https://wa.me/5491123145742" target="_blank" rel="noreferrer">Quiero hablar con un asesor</a></div></div>}
      {step === 8 && <div className="t360-result"><span className="t360-result-icon"><Check /></span><h2>¡Listo, {answers.fullName}! 🙌</h2><p>Recibimos tu solicitud y reservamos tu demostración/instalación.</p><div className="t360-appointment"><b>{labelDay(slot.slice(0,10))}</b><strong>{slot.slice(11,16)} h</strong></div><p>Tené encendida la PC donde querés utilizar Tienda360.</p><a className="t360-button" href={waUrl(answers, slot)} target="_blank" rel="noreferrer" onClick={() => trackFunnelEvent("whatsapp_clicked")}>Hablar con Tienda360 por WhatsApp</a></div>}
    </div>
    {error && <p className="t360-error" role="alert">{error}</p>}
    {step <= 5 && <div className="t360-wizard-footer">{step > 1 ? <button className="t360-back" onClick={() => setStep(s => s - 1)}><ArrowLeft /> Atrás</button> : <span />}{step < 5 ? <button className="t360-button" onClick={next}>Continuar</button> : <button className="t360-button" disabled={busy} onClick={submitLead}>{busy ? "Guardando…" : "Continuar y elegir horario"}</button>}</div>}
    {step === 6 && <div className="t360-wizard-footer"><button className="t360-back" onClick={() => setStep(5)}><ArrowLeft /> Atrás</button><button className="t360-button" disabled={busy || !slot} onClick={reserve}>{busy ? "Reservando…" : "Confirmar turno"}</button></div>}
  </div></dialog>;
}

