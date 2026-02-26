import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Restaurant {
  name: string;
  phone?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  primary_color?: string | null;
  name_color?: string | null;
  is_open?: boolean | null;
  open_time?: string | null;
  close_time?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface MenuHeaderProps {
  restaurant: Restaurant | null;
  categories: Category[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCategoryJump: (catId: string) => void;
}

export const MenuHeader = ({ restaurant, categories, searchQuery, onSearchChange, onCategoryJump }: MenuHeaderProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const bannerUrl = restaurant?.banner_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop";
  const logoUrl = restaurant?.logo_url;
  const isOpen = restaurant?.is_open !== false;
  const primaryColor = restaurant?.primary_color || "#E11D48";

  return (
    <div className="relative">
      {/* Banner — taller + dramatic gradient */}
      <div className="w-full h-44 md:h-56 overflow-hidden relative">
        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Restaurant info */}
      <div className="relative max-w-5xl mx-auto px-4 -mt-8 pb-4">
        <div className="flex items-end gap-4">
          {/* Logo with colored border */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-card overflow-hidden flex-shrink-0 shadow-lg"
            style={{ border: `4px solid ${primaryColor}` }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {restaurant?.name?.charAt(0) || "R"}
              </div>
            )}
          </motion.div>
          <div className="pb-1 flex-1 min-w-0">
            <h1
              className="text-xl md:text-2xl font-extrabold truncate"
              style={{
                color: restaurant?.name_color || undefined,
                textShadow: restaurant?.name_color
                  ? "1px 1px 0px rgba(0,0,0,0.3), 2px 2px 0px rgba(0,0,0,0.25), 3px 3px 0px rgba(0,0,0,0.2), 4px 4px 0px rgba(0,0,0,0.15), 5px 5px 10px rgba(0,0,0,0.4)"
                  : undefined,
              }}
            >{restaurant?.name || "Restaurante"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${isOpen ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                {isOpen && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
                {!isOpen && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                {isOpen ? "Aberto agora" : "Fechado"}
              </span>
              {restaurant?.open_time && restaurant?.close_time && (
                <span className="text-xs text-muted-foreground">
                  {restaurant.open_time} - {restaurant.close_time}
                </span>
              )}
              {restaurant?.phone && (
                <span className="text-xs text-muted-foreground hidden sm:inline">Tel: {restaurant.phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* Search + Category dropdown */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-shadow"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
          </div>
          {categories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Categorias
                <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-30 min-w-[180px]"
                  >
                    {categories.map((cat, i) => (
                      <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => { onCategoryJump(cat.id); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        {cat.name}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
