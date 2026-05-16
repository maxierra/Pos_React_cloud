"use client";

import * as XLSX from "xlsx-js-style";

function sanitizeSheetName(name: string): string {
  const cleaned = String(name ?? "").replace(/[:\\/?*[\]]/g, "-").trim();
  const base = cleaned.slice(0, 31) || "Hoja";
  return base;
}

function createStyledWorksheet(data: any[]): XLSX.WorkSheet {
  const worksheet = XLSX.utils.json_to_sheet(data, { cellDates: true });

  const keys = Object.keys(data[0] ?? {});
  worksheet["!cols"] = keys.map((k) => {
    const headerLen = String(k).length;
    let maxLen = headerLen;
    for (const row of data) {
      const v = (row as any)?.[k];
      const s = v === null || v === undefined ? "" : String(v);
      if (s.length > maxLen) maxLen = s.length;
    }
    return { wch: Math.min(50, Math.max(10, maxLen + 2)) };
  });

  try {
    const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1:A1");
    if (range.e.r >= 0 && range.e.c >= 0) {
      worksheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: range.e.r, c: range.e.c } }),
      };
    }
  } catch {
    // noop
  }

  (worksheet as any)["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: "A2",
    activePane: "bottomLeft",
    state: "frozen",
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { patternType: "solid", fgColor: { rgb: "0F766E" } },
    alignment: { vertical: "center", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "D4D4D8" } },
      bottom: { style: "thin", color: { rgb: "D4D4D8" } },
      left: { style: "thin", color: { rgb: "D4D4D8" } },
      right: { style: "thin", color: { rgb: "D4D4D8" } },
    },
  } as const;

  const cellBorder = {
    top: { style: "thin", color: { rgb: "E4E4E7" } },
    bottom: { style: "thin", color: { rgb: "E4E4E7" } },
    left: { style: "thin", color: { rgb: "E4E4E7" } },
    right: { style: "thin", color: { rgb: "E4E4E7" } },
  } as const;

  const ref = worksheet["!ref"] ?? "A1:A1";
  const range = XLSX.utils.decode_range(ref);
  const moneyCols = new Set<number>();
  const dateCols = new Set<number>();
  const countCols = new Set<number>();

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    const cell = (worksheet as any)[addr];
    const label = cell?.v ? String(cell.v).toLowerCase() : "";
    if (/total|monto|importe|inicial|final|vendido|caja/.test(label)) moneyCols.add(c);
    if (/fecha|apertura|cierre/.test(label)) dateCols.add(c);
    if (/cantidad/.test(label)) countCols.add(c);
  }

  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = (worksheet as any)[addr];
      if (!cell) continue;

      if (r === 0) {
        cell.s = headerStyle;
        continue;
      }

      const isOdd = r % 2 === 1;
      const baseFill = isOdd ? "FFFFFF" : "F8FAFC";
      const alignRight = moneyCols.has(c) || countCols.has(c);

      cell.s = {
        font: { color: { rgb: "111827" } },
        fill: { patternType: "solid", fgColor: { rgb: baseFill } },
        alignment: {
          vertical: "center",
          horizontal: alignRight ? "right" : "left",
          wrapText: true,
        },
        border: cellBorder,
      };

      if (cell.t === "d" || dateCols.has(c)) {
        cell.z = "dd/mm/yyyy hh:mm";
      }

      if (cell.t === "n" && moneyCols.has(c)) {
        cell.z = "$ #,##0.00";
      }

      if (cell.t === "n" && countCols.has(c)) {
        cell.z = "#,##0";
      }
    }
  }

  (worksheet as any)["!rows"] = [{ hpt: 22 }];
  return worksheet;
}

function writeWorkbookDownload(workbook: XLSX.WorkBook, filename: string) {
  const base = String(filename ?? "").trim() || "reporte";
  const safeBase = base.replace(/[\\/:*?"<>|]+/g, "-");
  const fullFilename = safeBase.toLowerCase().endsWith(".xlsx") ? safeBase : `${safeBase}.xlsx`;

  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullFilename;
  a.rel = "noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Genera un archivo Excel (.xlsx) real a partir de un arreglo de objetos.
 * Utiliza la librería SheetJS para asegurar compatibilidad total y formato binario profesional.
 */
export function exportToExcel(data: any[], filename: string) {
  if (data.length === 0) return;

  const worksheet = createStyledWorksheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  writeWorkbookDownload(workbook, filename);
}

export type StyledSheetInput = { name: string; data: any[] };

/**
 * Varias hojas con el mismo estilo (encabezado teal, filas alternadas, autofiltro, fechas).
 * Omite hojas sin filas.
 */
export function exportStyledWorkbook(sheets: StyledSheetInput[], filename: string) {
  const nonEmpty = sheets.filter((s) => Array.isArray(s.data) && s.data.length > 0);
  if (nonEmpty.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();

  for (const { name, data } of nonEmpty) {
    let sheetName = sanitizeSheetName(name);
    let n = 2;
    while (used.has(sheetName)) {
      const suffix = ` (${n})`;
      sheetName = sanitizeSheetName(name.slice(0, 31 - suffix.length) + suffix);
      n += 1;
    }
    used.add(sheetName);

    const ws = createStyledWorksheet(data);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }

  writeWorkbookDownload(workbook, filename);
}
