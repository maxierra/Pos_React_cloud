export type DemoAppearance = "light" | "dark";

export type DemoProduct = {
  id: string;
  name: string;
  price: number;
  category: "snacks" | "bebidas" | "almacen";
};

export type DemoCartLine = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

export type DemoSale = {
  id: string;
  total: number;
  paymentMethod: "cash" | "card" | "transfer";
  createdAt: number;
};

export type DemoStep =
  | { id: string; type: "search"; query: string }
  | { id: string; type: "add"; productId: string }
  | { id: string; type: "pay"; paymentMethod: "cash" | "card" | "transfer" };

