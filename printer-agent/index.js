#!/usr/bin/env node

// Agente local de impresión para POS.
// - Expone POST http://127.0.0.1:9410/print
// - Recibe { html: string } y lo envía a la impresora predeterminada.
// - Usa el paquete "printer" que delega en el spooler de Windows.

const express = require("express");
const cors = require("cors");
const os = require("os");
const fs = require("fs");
const path = require("path");
const printer = require("printer");

const app = express();
const PORT = process.env.POS_PRINTER_AGENT_PORT || 9410;

app.use(express.json({ limit: "256kb" }));

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir llamadas desde cualquier origen (el POS está autenticado por su propio backend).
      callback(null, true);
    },
  }),
);

function getDefaultPrinterName() {
  try {
    const def = printer.getDefaultPrinterName && printer.getDefaultPrinterName();
    if (def) return def;
    const printers = printer.getPrinters();
    if (printers && printers.length > 0) return printers[0].name;
  } catch {
    // ignore
  }
  return null;
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    hostname: os.hostname(),
    defaultPrinter: getDefaultPrinterName(),
  });
});

app.post("/print", async (req, res) => {
  try {
    const { html, printerName } = req.body || {};
    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "missing_html" });
    }

    const targetPrinter = printerName || getDefaultPrinterName();
    if (!targetPrinter) {
      return res.status(500).json({ error: "no_printer_configured" });
    }

    // Guardar HTML temporalmente y mandarlo a imprimir como si fuera un archivo.
    // El driver de la impresora decide cómo renderizarlo.
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `pos-ticket-${Date.now()}.html`);
    fs.writeFileSync(tmpFile, html, "utf8");

    printer.printFile(
      {
        filename: tmpFile,
        printer: targetPrinter,
      },
      function (err) {
        // Borrar archivo temporal después de mandar a la cola.
        fs.unlink(tmpFile, () => {});

        if (err) {
          console.error("Error al imprimir:", err);
          return res.status(500).json({ error: "print_failed", message: String(err.message || err) });
        }

        return res.json({ ok: true, printer: targetPrinter });
      },
    );
  } catch (e) {
    console.error("Error general en /print:", e);
    return res.status(500).json({ error: "internal_error", message: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`POS Printer Agent escuchando en http://127.0.0.1:${PORT}`);
  console.log(`Impresora predeterminada: ${getDefaultPrinterName() || "ninguna"}`);
});

