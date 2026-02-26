import burgerClassic from "@/assets/products/burger-classic.jpg";
import burgerBacon from "@/assets/products/burger-bacon.jpg";
import fries from "@/assets/products/fries.jpg";
import onionRings from "@/assets/products/onion-rings.jpg";
import cola from "@/assets/products/cola.jpg";
import juice from "@/assets/products/juice.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  removables: string[];
  extras: { name: string; price: number }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  removed: string[];
  extras: { name: string; price: number; qty: number; extra_id?: string; ingredient_id?: string; quantity_used?: number }[];
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  minStock: number;
  currentStock: number;
  expiry: string;
  responsible: string;
  category: string;
}

export interface Order {
  id: string;
  number: number;
  customer: string;
  items: { name: string; notes: string[] }[];
  total: number;
  status: "new" | "preparing" | "done";
  type: "delivery" | "pickup";
}

export const categories = ["Hambúrgueres", "Porções", "Bebidas"];

export const products: Product[] = [
  {
    id: "1", name: "Smash Clássico", description: "Dois smash burgers com queijo cheddar derretido, alface e tomate",
    price: 28.90, image: burgerClassic, category: "Hambúrgueres",
    removables: ["Cebola", "Alface", "Tomate", "Molho especial"],
    extras: [{ name: "Bacon", price: 4 }, { name: "Ovo", price: 3 }, { name: "Cheddar extra", price: 3.5 }],
  },
  {
    id: "2", name: "Bacon Burguer", description: "Hambúrguer artesanal com bacon crocante e queijo prato",
    price: 32.90, image: burgerBacon, category: "Hambúrgueres",
    removables: ["Cebola", "Alface", "Picles"],
    extras: [{ name: "Bacon extra", price: 5 }, { name: "Cheddar", price: 3.5 }],
  },
  {
    id: "3", name: "Batata Frita", description: "Porção generosa de batatas fritas crocantes com sal e orégano",
    price: 18.90, image: fries, category: "Porções",
    removables: [], extras: [{ name: "Cheddar", price: 4 }, { name: "Bacon", price: 5 }],
  },
  {
    id: "4", name: "Onion Rings", description: "Anéis de cebola empanados e fritos até ficarem dourados",
    price: 22.90, image: onionRings, category: "Porções",
    removables: [], extras: [{ name: "Molho barbecue", price: 2 }],
  },
  {
    id: "5", name: "Coca-Cola", description: "Copo 500ml gelado", price: 8.90, image: cola, category: "Bebidas",
    removables: [], extras: [],
  },
  {
    id: "6", name: "Suco Natural", description: "Suco de laranja natural 400ml", price: 12.90, image: juice, category: "Bebidas",
    removables: [], extras: [{ name: "Sem açúcar", price: 0 }],
  },
];

export const stockItems: StockItem[] = [
  { id: "1", name: "Pão brioche", unit: "un", minStock: 50, currentStock: 45, expiry: "2026-02-25", responsible: "João", category: "Pães" },
  { id: "2", name: "Hambúrguer 150g", unit: "un", minStock: 30, currentStock: 12, expiry: "2026-02-24", responsible: "João", category: "Proteínas" },
  { id: "3", name: "Queijo cheddar", unit: "kg", minStock: 5, currentStock: 3, expiry: "2026-03-10", responsible: "Maria", category: "Laticínios" },
  { id: "4", name: "Bacon", unit: "kg", minStock: 3, currentStock: 1, expiry: "2026-02-26", responsible: "Maria", category: "Proteínas" },
  { id: "5", name: "Alface", unit: "un", minStock: 20, currentStock: 25, expiry: "2026-02-24", responsible: "Carlos", category: "Hortifruti" },
  { id: "6", name: "Batata pré-frita", unit: "kg", minStock: 10, currentStock: 8, expiry: "2026-04-15", responsible: "Carlos", category: "Insumos" },
  { id: "7", name: "Coca-Cola 2L", unit: "un", minStock: 12, currentStock: 20, expiry: "2026-08-01", responsible: "João", category: "Bebidas" },
  { id: "8", name: "Ovo", unit: "dz", minStock: 5, currentStock: 2, expiry: "2026-02-24", responsible: "Maria", category: "Proteínas" },
];

export const orders: Order[] = [
  { id: "1", number: 101, customer: "Ana Silva", items: [{ name: "Smash Clássico", notes: ["Sem Cebola"] }, { name: "Batata Frita", notes: [] }], total: 47.80, status: "new", type: "delivery" },
  { id: "2", number: 102, customer: "Pedro Santos", items: [{ name: "Bacon Burguer", notes: ["Sem Picles"] }, { name: "Coca-Cola", notes: [] }], total: 41.80, status: "new", type: "pickup" },
  { id: "3", number: 103, customer: "Maria Oliveira", items: [{ name: "Smash Clássico", notes: [] }, { name: "Onion Rings", notes: [] }, { name: "Suco Natural", notes: [] }], total: 64.70, status: "preparing", type: "delivery" },
  { id: "4", number: 104, customer: "Lucas Lima", items: [{ name: "Bacon Burguer", notes: ["Sem Alface", "Sem Cebola"] }], total: 32.90, status: "preparing", type: "pickup" },
  { id: "5", number: 105, customer: "Julia Costa", items: [{ name: "Batata Frita", notes: [] }, { name: "Coca-Cola", notes: [] }], total: 27.80, status: "done", type: "delivery" },
];
