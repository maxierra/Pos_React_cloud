import Image from "next/image";

const ALT = "Tienda360 para kioscos, almacenes, minimercados, autoservicios, dietéticas, pet shops, ferreterías, perfumerías, librerías, indumentaria, zapaterías, carnicerías, verdulerías y fiambrerías";

export function BusinessTypes() { return <section className="t360-section t360-business" aria-label="Comercios para cada rubro"><div className="t360-wrap"><div className="t360-business-poster"><Image src="/Comercios%20para%20cada%20rubro.png" alt={ALT} width={2048} height={768} sizes="(max-width: 900px) 100vw, 1160px" /></div><div className="t360-business-mobile"><Image src="/Comercios%20para%20cada%20rubro%20mobile.png" alt={ALT} width={1106} height={1430} sizes="calc(100vw - 40px)" /></div></div></section> }

