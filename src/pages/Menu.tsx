import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ShoppingBag, Star, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { ProductModal } from "@/components/menu/ProductModal";
import { MenuHeader } from "@/components/menu/MenuHeader";
import { MenuProductCard } from "@/components/menu/MenuProductCard";
import { MenuSidebar } from "@/components/menu/MenuSidebar";
import { MenuCartSheet } from "@/components/menu/MenuCartSheet";
import { CheckoutModal } from "@/components/menu/CheckoutModal";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const Menu = () => {
  const { restaurantId: paramRid } = useParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { itemCount } = useCart();
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollingByClick = useRef(false);

  // Resolve restaurant
  const { data: fallbackRestaurant } = useQuery({
    queryKey: ["fallback-restaurant"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("id").limit(1).single();
      if (error) throw error;
      return data;
    },
    enabled: !paramRid,
  });

  const effectiveRestaurantId = paramRid || fallbackRestaurant?.id || null;

  // Fetch restaurant details (including new columns)
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant-details", effectiveRestaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", effectiveRestaurantId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveRestaurantId,
  });

  const primaryColor = (restaurant as any)?.primary_color || "#E11D48";

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["menu-products", effectiveRestaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("*")
        .eq("is_active", true).eq("restaurant_id", effectiveRestaurantId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveRestaurantId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories", effectiveRestaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories").select("*")
        .eq("restaurant_id", effectiveRestaurantId!)
        .order("display_order").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveRestaurantId,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const key = p.category_id || "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    const result: { category: any; items: Product[] }[] = [];
    categories.forEach((cat: any) => {
      const items = map.get(cat.id) || [];
      if (items.length > 0) result.push({ category: cat, items });
    });

    const uncategorized = map.get("uncategorized");
    const filtered = searchQuery
      ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : products;
    return categories
      .map((cat) => ({
        category: cat,
        items: filtered.filter((p) => (p as any).category_id === cat.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [products, categories, searchQuery]);

  const featuredProducts = useMemo(() =>
    products.filter((p) => (p as any).is_featured),
    [products]);

  const promoProducts = useMemo(() =>
    products.filter((p) => (p as any).promo_price != null),
    [products]);

  const promoBannerText = (restaurant as any)?.promo_banner_text || null;

  useEffect(() => {
    if (grouped.length > 0 && !activeCategory) setActiveCategory(grouped[0].category.id);
  }, [grouped, activeCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingByClick.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveCategory(entry.target.getAttribute("data-category-id"));
        });
      },
      { rootMargin: "-180px 0px -60% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [grouped]);

  const scrollToCategory = useCallback((catId: string) => {
    setActiveCategory(catId);
    const el = sectionRefs.current.get(catId);
    if (el) {
      isScrollingByClick.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { isScrollingByClick.current = false; }, 800);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ "--restaurant-primary": primaryColor } as React.CSSProperties}>
      {/* Header / Banner */}
      <MenuHeader
        restaurant={restaurant ? { ...restaurant, logo_url: (restaurant as any).logo_url, banner_url: (restaurant as any).banner_url, primary_color: (restaurant as any).primary_color, is_open: (restaurant as any).is_open, open_time: (restaurant as any).open_time, close_time: (restaurant as any).close_time } : null}
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCategoryJump={scrollToCategory}
      />

      {/* Category pills */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto max-w-5xl mx-auto scrollbar-hide">
          {grouped.map(({ category }, i) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => scrollToCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === category.id
                ? "text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              style={activeCategory === category.id ? { backgroundColor: primaryColor } : undefined}
            >
              {category.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main content area: products + sidebar cart */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-28 lg:pb-8">
        <div className="flex gap-6">
          {/* Products grid */}
          <div className="flex-1 space-y-8">

            {/* Destaques Section */}
            {!isLoading && featuredProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" style={{ color: primaryColor }} />
                  <h2 className="text-lg font-bold text-foreground">Destaques</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {featuredProducts.map((product, idx) => (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.07 }}
                      whileHover={{ y: -4, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedProduct(product)}
                      className="flex-shrink-0 w-[180px] bg-card rounded-xl border border-border overflow-hidden text-left group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center"><span className="text-2xl">🍔</span></div>
                        )}
                        {(product as any).badge && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase text-white px-2 py-0.5 rounded" style={{ backgroundColor: '#E11D48' }}>
                            {(product as any).badge}
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="font-semibold text-foreground text-xs truncate">{product.name}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                          R$ {Number((product as any).promo_price || product.sell_price).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Promoções Section */}
            {!isLoading && promoProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-3"
              >
                <div className="rounded-xl p-3" style={{ backgroundColor: `${primaryColor}15` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-5 w-5" style={{ color: primaryColor }} />
                    <h2 className="text-lg font-bold" style={{ color: primaryColor }}>
                      {promoBannerText || "Promoções"}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {promoProducts.map((product, idx) => (
                      <MenuProductCard
                        key={product.id}
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                        primaryColor={primaryColor}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Category Discovery Section */}
            {!isLoading && grouped.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground">Descubra nosso cardápio</h2>
                  <p className="text-sm text-muted-foreground">Escolha uma categoria e explore os melhores sabores</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {grouped.map(({ category, items }, i) => {
                    const coverImage = items.find((p) => p.image_url)?.image_url;
                    return (
                      <motion.button
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07, duration: 0.4 }}
                        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => scrollToCategory(category.id)}
                        className="relative rounded-2xl overflow-hidden aspect-[4/3] group"
                      >
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-3xl">🍽️</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                          <p className="text-white font-bold text-sm leading-tight drop-shadow-md">{category.name}</p>
                          <p className="text-white/70 text-xs mt-0.5">{items.length} {items.length === 1 ? "item" : "itens"}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }} />
              </div>
            )}

            {!isLoading && grouped.map(({ category, items }) => (
              <div
                key={category.id}
                ref={(el) => { if (el) sectionRefs.current.set(category.id, el); }}
                data-category-id={category.id}
                className="scroll-mt-[64px]"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex items-center gap-3 mb-5"
                >
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="w-1 h-6 rounded-full origin-bottom"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                  <div className="flex-1 h-px bg-border" />
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((product, idx) => (
                    <MenuProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                      primaryColor={primaryColor}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            ))}

            {!isLoading && grouped.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>
            )}
          </div>

          {/* Desktop sidebar cart */}
          <div className="hidden lg:block w-[340px] flex-shrink-0">
            <MenuSidebar
              primaryColor={primaryColor}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Mobile floating cart button */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.5 }}
        className="lg:hidden fixed bottom-4 left-4 right-4 z-40"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCartSheetOpen(true)}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-shadow"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingBag className="h-5 w-5" />
          Ver sacola
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="bg-white/25 text-white text-xs font-bold px-2.5 py-0.5 rounded-full"
            >
              {itemCount}
            </motion.span>
          )}
        </motion.button>
      </motion.div>

      {/* Mobile cart bottom sheet */}
      <MenuCartSheet
        open={cartSheetOpen}
        onClose={() => setCartSheetOpen(false)}
        primaryColor={primaryColor}
        onCheckout={() => { setCartSheetOpen(false); setCheckoutOpen(true); }}
      />

      {/* Checkout modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        restaurantId={effectiveRestaurantId}
        restaurantPhone={restaurant?.phone}
        primaryColor={primaryColor}
      />

      {/* Product detail modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        primaryColor={primaryColor}
      />
    </div>
  );
};

export default Menu;
