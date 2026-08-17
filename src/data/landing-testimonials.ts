export type LandingTestimonial = {
  id: string;
  business: string;
  location: string;
  quote: string;
  image: string | null;
  logo: string | null;
  verified: boolean;
};

export const landingTestimonials: LandingTestimonial[] = [
  {
    id: "almacen-san-martin",
    business: "Almacén",
    location: "San Martín",
    quote:
      "Lo empezamos a usar para tener más orden con las ventas y el stock. Es sencillo y después de unos días ya lo usábamos normalmente.",
    image: null,
    logo: null,
    verified: false,
  },
  {
    id: "kiosco-caba",
    business: "Kiosco",
    location: "CABA",
    quote:
      "Lo que más nos sirve es poder escanear los productos y cobrar más rápido. También podemos revisar la caja al final del día sin estar haciendo cuentas aparte.",
    image: null,
    logo: null,
    verified: false,
  },
  {
    id: "autoservicio-zona-oeste",
    business: "Autoservicio",
    location: "Zona Oeste",
    quote:
      "Teníamos muchos productos y se nos hacía difícil controlar precios y stock. Con Tienda360 tenemos todo más organizado y podemos consultar las ventas cuando lo necesitamos.",
    image: null,
    logo: null,
    verified: false,
  },
];
