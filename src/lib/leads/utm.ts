export type LeadAttribution = {
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null;
  utmContent: string | null; utmTerm: string | null; landingUrl: string; referrer: string | null;
};

export function readLeadAttribution(): LeadAttribution {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"), utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"), landingUrl: window.location.href,
    referrer: document.referrer || null,
  };
}

