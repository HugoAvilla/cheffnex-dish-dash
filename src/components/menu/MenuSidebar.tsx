import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface MenuSidebarProps {
  primaryColor?: string;
  onCheckout: () => void;
}

export const MenuSidebar = ({ primaryColor, onCheckout }: MenuSidebarProps) => {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);

  const accentColor = primaryColor || "hsl(var(--accent))";

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 sticky top-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
            <ShoppingBag className="h-4 w-4" />
          </span>
          Sua sacola
        </h2>
        <p className="text-sm text-muted-foreground mt-4 text-center py-6">
          Sua sacola está vazia. Adicione itens do cardápio!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl sticky top-4 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
            <ShoppingBag className="h-4 w-4" />
          </span>
          Sua sacola
          <span className="text-xs font-medium text-muted-foreground">({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
        </h2>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3 max-h-[45vh] overflow-y-auto">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3">
            {item.product.image && (
              <img src={item.product.image} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" alt="" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {item.removed.length > 0 && (
                <p className="text-[10px] text-destructive">Sem: {item.removed.join(", ")}</p>
              )}
              {item.extras.length > 0 && (
                <p className="text-[10px] text-muted-foreground">+{item.extras.map((e) => `${e.qty}x ${e.name}`).join(", ")}</p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(idx, item.quantity - 1)}
                    className="h-6 w-6 rounded-full border border-border flex items-center justify-center bg-card text-foreground"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-medium w-4 text-center text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(idx, item.quantity + 1)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                  R$ {((item.product.price + item.extras.reduce((s, e) => s + e.price * e.qty, 0)) * item.quantity).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="px-4 pb-3">
        {!showCoupon ? (
          <button onClick={() => setShowCoupon(true)} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            🏷️ Tem um cupom?
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Código do cupom"
              className="flex-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: accentColor }}>
              Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Total + CTA */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span className="text-foreground">Total</span>
          <span style={{ color: accentColor }}>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: accentColor }}
        >
          Continuar pedido
        </button>
      </div>
    </div>
  );
};
