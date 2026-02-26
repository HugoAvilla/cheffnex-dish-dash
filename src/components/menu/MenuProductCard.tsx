import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface MenuProductCardProps {
  product: Product;
  onClick: () => void;
  primaryColor?: string;
  index?: number;
}

const BADGE_COLORS: Record<string, string> = {
  "NOVIDADE": "#16A34A",
  "EDIÇÃO LIMITADA": "#9333EA",
  "PROMOÇÃO": "#E11D48",
  "MAIS VENDIDO": "#EA580C",
};

export const MenuProductCard = ({ product, onClick, primaryColor, index = 0 }: MenuProductCardProps) => {
  const badge = (product as any).badge as string | null;
  const promoPrice = (product as any).promo_price as number | null;
  const badgeColor = badge ? BADGE_COLORS[badge] || primaryColor || "#E11D48" : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, boxShadow: "0 12px 28px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full bg-card rounded-xl border border-border overflow-hidden text-left group flex flex-row h-[130px]"
    >
      {/* Text info (left side) */}
      <div className="flex-1 p-3.5 flex flex-col min-w-0">
        {badge && (
          <span
            className="inline-flex self-start text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded mb-1.5"
            style={{ backgroundColor: badgeColor! }}
          >
            {badge}
          </span>
        )}
        <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-2">
          {promoPrice ? (
            <>
              <span className="text-xs text-muted-foreground line-through">
                R$ {Number(product.sell_price).toFixed(2).replace(".", ",")}
              </span>
              <span className="text-sm font-extrabold" style={{ color: "#E11D48" }}>
                R$ {Number(promoPrice).toFixed(2).replace(".", ",")}
              </span>
            </>
          ) : (
            <span className="text-sm font-extrabold tracking-tight" style={{ color: primaryColor || "hsl(var(--accent))" }}>
              R$ {Number(product.sell_price).toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>
      </div>

      {/* Image (right side) */}
      <div className="relative w-[130px] h-full flex-shrink-0 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-3xl">🍔</span>
          </div>
        )}
        {/* + button */}
        <div
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ backgroundColor: primaryColor || "hsl(var(--accent))" }}
        >
          <Plus className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
};
