import React, { createContext, useContext, useState } from "react";
import { CartItem, Product } from "@/data/mockData";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, removed: string[], extras: { name: string; price: number; qty: number; extra_id?: string; ingredient_id?: string; quantity_used?: number }[]) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, removed: string[], extras: { name: string; price: number; qty: number; extra_id?: string; ingredient_id?: string; quantity_used?: number }[]) => {
    setItems((prev) => [...prev, { product, quantity: 1, removed, extras }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty <= 0) { removeItem(index); return; }
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item)));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((s, e) => s + e.price * e.qty, 0);
    return sum + (item.product.price + extrasTotal) * item.quantity;
  }, 0);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
