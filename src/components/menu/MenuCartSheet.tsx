import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";

interface MenuCartSheetProps {
  open: boolean;
  onClose: () => void;
  primaryColor?: string;
  onCheckout: () => void;
}

export const MenuCartSheet = ({ open, onClose, primaryColor, onCheckout }: MenuCartSheetProps) => {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const accentColor = primaryColor || "hsl(var(--accent))";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
                  <ShoppingBag className="h-4 w-4" />
                </span>
                Sua sacola
                <span className="text-xs font-sans font-medium text-muted-foreground">({itemCount})</span>
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">Sua sacola está vazia</p>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex gap-3 bg-muted/50 rounded-xl p-3"
                    >
                      {item.product.image && (
                        <img src={item.product.image} className="h-14 w-14 rounded-lg object-cover" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                          <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {item.removed.length > 0 && <p className="text-[10px] text-destructive">Sem: {item.removed.join(", ")}</p>}
                        {item.extras.length > 0 && <p className="text-[10px] text-muted-foreground">+{item.extras.map((e) => `${e.qty}x ${e.name}`).join(", ")}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="h-6 w-6 rounded-full border border-border flex items-center justify-center">
                              <Minus className="h-3 w-3 text-foreground" />
                            </button>
                            <span className="text-xs font-medium w-4 text-center text-foreground">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="h-6 w-6 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold" style={{ color: accentColor }}>
                            R$ {((item.product.price + item.extras.reduce((s, e) => s + e.price * e.qty, 0)) * item.quantity).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-foreground">Total</span>
                    <span style={{ color: accentColor }}>R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <button
                    onClick={onCheckout}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accentColor }}
                  >
                    Continuar pedido
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
