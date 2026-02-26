import { useState, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { X, Minus, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface Props {
  product: Product | null;
  onClose: () => void;
  primaryColor?: string;
}

export const ProductModal = ({ product, onClose, primaryColor }: Props) => {
  const { addItem } = useCart();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [removed, setRemoved] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});

  const accentColor = primaryColor || "hsl(var(--accent))";

  // Fetch removable ingredients
  const { data: removables = [] } = useQuery({
    queryKey: ["removables", product?.id],
    queryFn: async () => {
      if (!product) return [];
      const { data, error } = await supabase
        .from("recipes")
        .select("ingredient_id, ingredients(name)")
        .eq("product_id", product.id)
        .eq("can_remove", true);
      if (error) throw error;
      return (data || []).map((r: any) => r.ingredients?.name).filter(Boolean) as string[];
    },
    enabled: !!product,
  });

  // Fetch extras for this product
  const { data: extras = [] } = useQuery({
    queryKey: ["product-extras", product?.id],
    queryFn: async () => {
      if (!product) return [];
      const { data, error } = await supabase
        .from("extras")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!product,
  });

  // Fetch cross-sell rules for this product's category
  const { data: crossSellRules = [] } = useQuery({
    queryKey: ["cross-sell-rules", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data, error } = await supabase
        .from("cross_sell_rules")
        .select("*, suggest_category:categories!cross_sell_rules_suggest_category_id_fkey(id, name)")
        .eq("trigger_category_id", product.category_id)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  // Fetch suggested products for cross-sell
  const suggestCategoryIds = useMemo(
    () => crossSellRules.map((r: any) => r.suggest_category_id),
    [crossSellRules]
  );

  const { data: crossSellProducts = [] } = useQuery({
    queryKey: ["cross-sell-products", suggestCategoryIds],
    queryFn: async () => {
      if (suggestCategoryIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("category_id", suggestCategoryIds)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: suggestCategoryIds.length > 0,
  });

  if (!product) return null;

  const toggleRemove = (item: string) =>
    setRemoved((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));

  const updateExtraQty = (extraId: string, delta: number) => {
    setSelectedExtras((prev) => {
      const current = prev[extraId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [extraId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [extraId]: next };
    });
  };

  const extrasTotal = extras.reduce((sum: number, e: any) => {
    return sum + (Number(e.price) * (selectedExtras[e.id] || 0));
  }, 0);

  const totalPrice = Number(product.sell_price) + extrasTotal;

  // Determine steps
  const hasRemovables = removables.length > 0;
  const hasExtras = extras.length > 0;
  const crossSellSteps = crossSellRules.map((rule: any) => ({
    label: rule.step_label,
    categoryId: rule.suggest_category_id,
    categoryName: (rule as any).suggest_category?.name || rule.step_label,
  }));
  const totalSteps = 1 + (hasRemovables ? 1 : 0) + (hasExtras ? 1 : 0) + crossSellSteps.length;

  // Map step index to step type
  const getStepType = (s: number) => {
    let idx = 0;
    if (s === idx) return "info";
    idx++;
    if (hasRemovables) { if (s === idx) return "removables"; idx++; }
    if (hasExtras) { if (s === idx) return "extras"; idx++; }
    for (let i = 0; i < crossSellSteps.length; i++) {
      if (s === idx) return `crosssell-${i}`;
      idx++;
    }
    return "info";
  };

  const currentStepType = getStepType(step);

  const handleAdd = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: Number(product.sell_price),
      image: product.image_url || "",
      category: product.category,
      removables: removables,
      extras: [],
    };

    const cartExtras = extras
      .filter((e: any) => selectedExtras[e.id] > 0)
      .map((e: any) => ({
        name: e.name,
        price: Number(e.price),
        qty: selectedExtras[e.id],
        extra_id: e.id,
        ingredient_id: e.ingredient_id || undefined,
        quantity_used: Number(e.quantity_used) || 0,
      }));

    addItem(cartProduct, removed, cartExtras);
    resetAndClose();
  };

  const handleAddCrossSell = (p: any) => {
    const cartProduct = {
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Number(p.sell_price),
      image: p.image_url || "",
      category: p.category,
      removables: [],
      extras: [],
    };
    addItem(cartProduct, [], []);
  };

  const resetAndClose = () => {
    setStep(0);
    setRemoved([]);
    setSelectedExtras({});
    onClose();
  };

  const canGoNext = step < totalSteps - 1;

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={resetAndClose}
          />
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={!isMobile ? { top: "50%", left: "50%", x: "-50%", y: "-50%" } : undefined}
            className={`fixed z-50 bg-card overflow-y-auto ${isMobile
              ? "bottom-0 left-0 right-0 w-full rounded-t-3xl max-h-[85vh]"
              : "w-[28rem] max-w-[90vw] rounded-3xl max-h-[80vh]"
              }`}
          >
            <div className="relative">
              {product.image_url && (
                <div className="relative">
                  <img src={product.image_url} alt={product.name} className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                </div>
              )}
              <button
                onClick={resetAndClose}
                className="absolute top-3 right-3 bg-card/60 backdrop-blur-md rounded-full p-1.5 hover:bg-card/80 transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Step: Info (always visible header) */}
              <div>
                <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
                <p className="font-black text-lg mt-1" style={{ color: accentColor }}>
                  R$ {Number(product.sell_price).toFixed(2).replace(".", ",")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
              </div>

              {/* Step: Removables */}
              {currentStepType === "removables" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                  <h3 className="font-semibold text-foreground">O que vamos tirar?</h3>
                  <div className="space-y-2">
                    {removables.map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors">
                        <div
                          className="h-5 w-5 rounded border-2 flex items-center justify-center transition-colors"
                          style={removed.includes(item)
                            ? { backgroundColor: accentColor, borderColor: accentColor }
                            : { borderColor: "hsl(var(--border))" }
                          }
                        >
                          {removed.includes(item) && <X className="h-3 w-3 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={removed.includes(item)}
                          onChange={() => toggleRemove(item)}
                          className="sr-only"
                        />
                        <span className="text-sm text-foreground">Sem {item}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step: Extras (Turbine seu Lanche) */}
              {currentStepType === "extras" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                  <h3 className="font-semibold text-foreground">🔥 Turbine seu Lanche</h3>
                  <div className="space-y-2">
                    {extras.map((extra: any) => (
                      <div key={extra.id} className="flex items-center justify-between bg-muted rounded-xl p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{extra.name}</p>
                          <p className="text-xs font-semibold" style={{ color: accentColor }}>+ R$ {Number(extra.price).toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(selectedExtras[extra.id] || 0) > 0 && (
                            <>
                              <button
                                onClick={() => updateExtraQty(extra.id, -1)}
                                className="h-8 w-8 rounded-full border border-border flex items-center justify-center bg-card"
                              >
                                <Minus className="h-3.5 w-3.5 text-foreground" />
                              </button>
                              <span className="text-sm font-medium w-4 text-center text-foreground">{selectedExtras[extra.id]}</span>
                            </>
                          )}
                          <button
                            onClick={() => updateExtraQty(extra.id, 1)}
                            className="h-8 w-8 rounded-full text-white flex items-center justify-center"
                            style={{ backgroundColor: accentColor }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step: Cross-sell */}
              {currentStepType.startsWith("crosssell-") && (() => {
                const csIdx = parseInt(currentStepType.split("-")[1]);
                const csStep = crossSellSteps[csIdx];
                const csProducts = crossSellProducts.filter((p: any) => p.category_id === csStep.categoryId);
                return (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                    <h3 className="font-semibold text-foreground">🍟 {csStep.label}</h3>
                    <div className="space-y-2">
                      {csProducts.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 bg-muted rounded-xl p-3">
                          {p.image_url && <img src={p.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            <p className="text-xs font-semibold" style={{ color: accentColor }}>R$ {Number(p.sell_price).toFixed(2).replace(".", ",")}</p>
                          </div>
                          <button
                            onClick={() => handleAddCrossSell(p)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
                            style={{ backgroundColor: accentColor }}
                          >
                            Adicionar
                          </button>
                        </div>
                      ))}
                      {csProducts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sugestão disponível</p>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            {/* Footer with navigation */}
            <div className="p-4 border-t border-border space-y-3">
              {/* Nav buttons */}
              {totalSteps > 1 && (
                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Voltar
                    </button>
                  )}
                  {canGoNext && (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleAdd}
                className="w-full text-white font-bold py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accentColor }}
              >
                Adicionar ao Carrinho — R$ {totalPrice.toFixed(2).replace(".", ",")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
