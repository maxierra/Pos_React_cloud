import type { LeadClassification, QualificationAnswers } from "./types";

// Centralizado para que Comercial pueda ajustar señales sin tocar el wizard.
export const LEAD_SCORE_WEIGHTS = {
  intent: { implement: 5, replace: 5, learn: 2, browsing: -4 },
  pcStatus: { windows: 2, no_pc: 0, unsure: 0 },
  readerStatus: { yes: 1, no: 0, want_one: 1 },
} as const;

export function scoreLead(answers: QualificationAnswers) {
  const score = LEAD_SCORE_WEIGHTS.intent[answers.intent]
    + LEAD_SCORE_WEIGHTS.pcStatus[answers.pcStatus]
    + LEAD_SCORE_WEIGHTS.readerStatus[answers.readerStatus];
  const classification: LeadClassification = score >= 6
    ? "ALTA INTENCIÓN"
    : score >= 2
      ? "MEDIA INTENCIÓN"
      : "BAJA INTENCIÓN";
  return { score, classification };
}

