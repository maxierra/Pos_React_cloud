export const BUSINESS_TYPES = ["Kiosco", "Almacén", "Minimercado", "Dietética", "Pet shop", "Ferretería", "Indumentaria", "Carnicería / Verdulería / Fiambrería", "Otro"] as const;
export const PC_OPTIONS = ["windows", "no_pc", "unsure"] as const;
export const READER_OPTIONS = ["yes", "no", "want_one"] as const;
export const INTENT_OPTIONS = ["implement", "replace", "learn", "browsing"] as const;
export const LEAD_STATUSES = ["NUEVO", "CALIFICADO", "AGENDADO", "CONTACTADO", "INSTALADO", "EN PRUEBA", "ACTIVADO", "NO INTERESADO", "NO SE PRESENTÓ"] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type PcOption = (typeof PC_OPTIONS)[number];
export type ReaderOption = (typeof READER_OPTIONS)[number];
export type IntentOption = (typeof INTENT_OPTIONS)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadClassification = "ALTA INTENCIÓN" | "MEDIA INTENCIÓN" | "BAJA INTENCIÓN";

export type QualificationAnswers = {
  businessType: BusinessType;
  pcStatus: PcOption;
  readerStatus: ReaderOption;
  intent: IntentOption;
};

