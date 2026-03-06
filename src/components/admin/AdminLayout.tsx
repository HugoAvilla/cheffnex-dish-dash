import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, ClipboardList, LogOut, List, Eye, Store, Paintbrush, BarChart2, DollarSign, Settings, BookTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import logoFinal from "@/assets/logo-final.png";

const getNavItems = (restaurantId: string | null) => [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/stock", icon: Package, label: "Estoque" },
  { to: "/admin/categories", icon: List, label: "Categorias" },
  { to: "/admin/products", icon: ShoppingBag, label: "Produtos" },
  { to: "/admin/orders", icon: ClipboardList, label: "Pedidos" },
  { to: "/admin/restaurant", icon: Store, label: "Restaurante" },
  { to: "/admin/storefront", icon: Paintbrush, label: "Personalizar" },
  { to: "/admin/relatorios", icon: BarChart2, label: "Relatórios" },
  { to: "/admin/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/admin/templates", icon: BookTemplate, label: "Templates" },
  { to: "/admin/settings", icon: Settings, label: "Configurações" },
  { to: restaurantId ? `/ menu / ${restaurantId} ` : "/", icon: Eye, label: "Ver Cardápio" },
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-60 bg-sidebar flex-col border-r border-sidebar-border">
        <div
          className="flex items-center justify-center -mx-4 -mt-2 mb-4 py-8"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%)',
            maskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%)'
          }}
        >
          <img src={logoFinal} alt="CheffNex" className="h-16 w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items - center gap - 3 px - 3 py - 2.5 rounded - lg text - sm font - medium transition - colors ${active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  } `}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-3 pb-4 space-y-1">
          <ThemeToggle />
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full">
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className={`flex flex - col items - center gap - 0.5 px - 3 py - 1 text - xs ${active ? "text-accent" : "text-muted-foreground"} `}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};
