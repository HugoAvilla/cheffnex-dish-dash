import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, ClipboardList, LogOut, List, Eye, Store, Paintbrush, BarChart2, DollarSign, Settings, BookTemplate } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import logoFinal from "@/assets/logo-final.png";

const getNavItems = (restaurantId: string | null) => [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/orders", icon: ClipboardList, label: "Pedidos" },
  { to: "/admin/products", icon: ShoppingBag, label: "Produtos" },
  { to: "/admin/categories", icon: List, label: "Categorias" },
  { to: "/admin/templates", icon: BookTemplate, label: "Templates Livres" },
  { to: "/admin/stock", icon: Package, label: "Estoque (Ficha Técnica)" },
  { to: "/admin/financeiro", icon: DollarSign, label: "Financeiro & Cupons" },
  { to: "/admin/relatorios", icon: BarChart2, label: "Relatórios de Vendas" },
  { to: "/admin/storefront", icon: Paintbrush, label: "Personalizar Loja" },
  { to: "/admin/restaurant", icon: Store, label: "Meu Restaurante" },
  { to: "/admin/settings", icon: Settings, label: "Configurações Globais" },
  { to: restaurantId ? `/menu/${restaurantId}` : "/", icon: Eye, label: "Ver Cardápio" },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, restaurantId } = useAuth();
  const navItems = getNavItems(restaurantId);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 bg-card/40 backdrop-blur-md flex-col border-r border-border shadow-sm transition-all">
        <div
          className="flex items-center justify-center pt-8 pb-6 px-4"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 80%)',
            maskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 80%)'
          }}
        >
          <img src={logoFinal} alt="CheffNex" className="h-16 w-auto object-contain drop-shadow-lg" />
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto scrollbar-hide">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Menu Principal</p>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
              >
                <item.icon className={`h-4 w-4 transition-colors ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-card/30 space-y-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-destructive/80 hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.05)] flex justify-around py-3 px-2 safe-area-pb">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
              <span className="text-[10px] font-medium tracking-tight">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-muted/20 pb-20 md:pb-0">
        <div className="h-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
