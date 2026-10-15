"use client";

const rows = [
  ["Gaseosa 1,5 L", "$2.300"],
  ["Galletitas", "$1.250"],
  ["Yerba 500 g", "$2.450"],
] as const;

export function TicketAnimation() {
  return (
    <div className="lp-ticket" aria-label="Ejemplo animado de una venta en Tienda360">
      <div className="lp-ticket-top"><span>Ejemplo de venta</span><span>● En línea</span></div>
      <div className="lp-ticket-paper">
        <div className="lp-ticket-store"><strong>Kiosco Ejemplo</strong><span>Ticket #0148</span></div>
        <div className="lp-scanner" aria-hidden="true"><span /><i /></div>
        <div className="lp-ticket-rows">
          {rows.map(([name, price], index) => <div key={name} style={{ "--row": index } as React.CSSProperties}><span>{name}</span><b>{price}</b></div>)}
        </div>
        <div className="lp-ticket-total"><span>Total</span><strong>$6.000</strong></div>
        <div className="lp-ticket-paid">✓ Venta registrada · Stock actualizado</div>
      </div>
    </div>
  );
}
