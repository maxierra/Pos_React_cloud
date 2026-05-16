import type { DemoAppearance } from "@/components/landing/demo-types";

/** Colores y fondos explícitos por modo (no dependen de variables heredadas del `html.dark`). */
export type DemoChrome = {
  shell: string;
  demoBadge: string;
  h3: string;
  muted: string;
  statusBox: string;
  stepOff: string;
  stepOn: string;
  panel: string;
  panelAlt: string;
  innerWell: string;
  tableShell: string;
  tableHead: string;
  tableRowBorder: string;
  pillSuccess: string;
  modalBlock: string;
  paySidePanel: string;
  payRow: string;
  modalPayInner: string;
  accent: string;
  searchCursor: string;
  searchField: string;
  posCard: string;
  productTileIdle: string;
  productTileActive: string;
  plusBtn: string;
  scanChip: string;
  cartCard: string;
  cartLine: string;
  cartEmpty: string;
  cartTotalBox: string;
  cartTotalValue: string;
  cartFlowBox: string;
  cartFlowText: string;
  dashboardShell: string;
  kpiDefault: string;
  kpiEmerald: string;
  kpiAmber: string;
  kpiRose: string;
  chartCard: string;
  chartTrack: string;
  chartBar: string;
  methodEmerald: string;
  methodAmber: string;
  methodViolet: string;
  ticketOverlay: string;
};

export function getDemoChrome(skin: DemoAppearance): DemoChrome {
  if (skin === "light") {
    return {
      shell:
        "border border-sky-200/90 bg-gradient-to-br from-sky-100/90 via-white to-emerald-50/80 text-zinc-900 shadow-[0_28px_70px_-30px_rgba(56,189,248,0.45)]",
      demoBadge: "border-sky-300/80 bg-white text-sky-900 shadow-sm",
      h3: "text-zinc-900",
      muted: "text-zinc-600",
      statusBox: "border-zinc-200 bg-white text-zinc-600 shadow-sm",
      stepOff: "border-zinc-200 bg-white/95 text-zinc-600",
      stepOn: "border-emerald-400 bg-emerald-100 text-emerald-950 shadow-sm",
      panel: "border-zinc-200 bg-white shadow-sm",
      panelAlt: "border-zinc-200 bg-zinc-50",
      innerWell: "border-zinc-200 bg-white",
      tableShell: "border-zinc-200 bg-white",
      tableHead: "border-b border-zinc-200 bg-zinc-100 text-zinc-600",
      tableRowBorder: "border-b border-zinc-100",
      pillSuccess: "border-emerald-400/40 bg-emerald-50 text-emerald-800",
      modalBlock: "border-zinc-200 bg-zinc-50",
      paySidePanel: "border-zinc-200 bg-white shadow-sm",
      payRow: "border-zinc-200 bg-zinc-50",
      modalPayInner: "border-zinc-200 bg-white",
      accent: "text-emerald-600",
      searchCursor: "bg-emerald-600",
      searchField: "border-zinc-300 bg-white text-zinc-900 shadow-inner",
      posCard: "border-zinc-200 bg-white shadow-sm",
      productTileIdle: "border-zinc-200 bg-zinc-50",
      productTileActive: "border-emerald-400 bg-emerald-50 shadow-md",
      plusBtn: "border-zinc-200 bg-white text-zinc-600",
      scanChip: "border-emerald-400/50 bg-emerald-50 text-emerald-800",
      cartCard: "border-zinc-200 bg-white shadow-sm",
      cartLine: "border-zinc-200 bg-zinc-50",
      cartEmpty: "border-zinc-200 border-dashed bg-zinc-50/50 text-zinc-500",
      cartTotalBox: "border-emerald-400/40 bg-emerald-50",
      cartTotalValue: "text-emerald-700",
      cartFlowBox: "border-emerald-300 bg-emerald-50",
      cartFlowText: "text-emerald-700",
      dashboardShell:
        "border-indigo-200 bg-gradient-to-br from-white via-sky-50/30 to-emerald-50/40 shadow-sm",
      kpiDefault: "border-zinc-200 bg-white text-zinc-900",
      kpiEmerald: "border-emerald-300/60 bg-emerald-50 text-emerald-800",
      kpiAmber: "border-amber-300/60 bg-amber-50 text-amber-900",
      kpiRose: "border-rose-300/60 bg-rose-50 text-rose-800",
      chartCard: "border-sky-200 bg-white",
      chartTrack: "bg-sky-100",
      chartBar: "bg-sky-600",
      methodEmerald: "bg-emerald-100/90 text-zinc-900",
      methodAmber: "bg-amber-100/90 text-zinc-900",
      methodViolet: "bg-violet-100/90 text-zinc-900",
      ticketOverlay: "bg-slate-900/25 backdrop-blur-[2px]",
    };
  }

  return {
    shell:
      "border border-slate-600/70 bg-gradient-to-br from-slate-950 via-[#080d18] to-indigo-950 text-zinc-100 shadow-[0_32px_80px_-28px_rgba(0,0,0,0.9)]",
    demoBadge: "border-violet-500/35 bg-violet-950/50 text-violet-200",
    h3: "text-white",
    muted: "text-zinc-400",
    statusBox: "border-slate-600 bg-slate-900/90 text-zinc-400",
    stepOff: "border-slate-700 bg-slate-900/70 text-zinc-400",
    stepOn:
      "border-emerald-500/45 bg-emerald-950/55 text-emerald-100 shadow-[0_0_28px_-10px_rgba(16,185,129,0.4)]",
    panel: "border-slate-700 bg-slate-900/95",
    panelAlt: "border-slate-700 bg-slate-800/90",
    innerWell: "border-slate-700 bg-slate-950/90",
    tableShell: "border-slate-700 bg-slate-950/95",
    tableHead: "border-b border-slate-700 bg-slate-800/95 text-zinc-400",
    tableRowBorder: "border-b border-slate-800",
    pillSuccess: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    modalBlock: "border-slate-600 bg-slate-800/95",
    paySidePanel: "border-slate-700 bg-slate-900/95",
    payRow: "border-slate-700 bg-slate-800/85",
    modalPayInner: "border-slate-600 bg-slate-900/95",
    accent: "text-emerald-400",
    searchCursor: "bg-emerald-400",
    searchField: "border-slate-600 bg-slate-950 text-zinc-100 shadow-inner",
    posCard: "border-slate-700 bg-slate-900/95",
    productTileIdle: "border-slate-700 bg-slate-800/85",
    productTileActive: "border-emerald-500/45 bg-emerald-950/45 shadow-md",
    plusBtn: "border-slate-600 bg-slate-900 text-zinc-400",
    scanChip: "border-emerald-500/35 bg-emerald-950/60 text-emerald-200",
    cartCard: "border-slate-700 bg-slate-900/95",
    cartLine: "border-slate-700 bg-slate-800/85",
    cartEmpty: "border-slate-700 border-dashed bg-slate-900/40 text-zinc-500",
    cartTotalBox: "border-emerald-500/35 bg-emerald-950/45",
    cartTotalValue: "text-emerald-300",
    cartFlowBox: "border-emerald-500/40 bg-emerald-950/40",
    cartFlowText: "text-emerald-300",
    dashboardShell:
      "border-indigo-900/50 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60",
    kpiDefault: "border-slate-700 bg-slate-900 text-zinc-100",
    kpiEmerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    kpiAmber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    kpiRose: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    chartCard: "border-slate-700 bg-slate-900/95",
    chartTrack: "bg-slate-800/90",
    chartBar: "bg-cyan-500",
    methodEmerald: "bg-emerald-500/12 text-zinc-100",
    methodAmber: "bg-amber-500/12 text-zinc-100",
    methodViolet: "bg-violet-500/12 text-zinc-100",
    ticketOverlay: "bg-black/50 backdrop-blur-[2px]",
  };
}
