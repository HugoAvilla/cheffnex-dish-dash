import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, ClipboardList, LogOut, List, Eye, Store, Paintbrush, BarChart2, DollarSign, Settings, BookTemplate, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import logoFinal from "@/assets/logo-final.png";

const getNavItems = (restaurantId: string | null, email: string | undefined) => {
  const items = [
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

  if (email === "Hg.lavila@gmail.com") {
    items.splice(11, 0, { to: "/admin/master-diagnostics", icon: ShieldAlert, label: "Master Dados" });
  }

  return items;
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, restaurantId, user } = useAuth();
  const navItems = getNavItems(restaurantId, user?.email);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="h-screen w-full flex bg-background font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 bg-card/40 backdrop-blur-md flex-col border-r border-border shadow-sm transition-all h-full">
        <div className="flex items-center justify-center pt-8 pb-6 px-4 w-full">
          <img
            src={logoFinal}
            alt="CheffNex"
            className="h-14 sm:h-16 w-auto object-cover rounded-[1.5rem] shadow-lg ring-1 ring-border/20"
          />
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
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
      <main className="flex-1 overflow-y-auto bg-muted/20 pb-20 md:pb-0 relative h-full">
        <div className="h-full max-w-[1600px] mx-auto min-h-max">
          {children}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event('open-tutorial'))}
            className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_rgba(255,145,77,0.39)] flex items-center justify-center hover:scale-110 hover:bg-primary transition-all backdrop-blur-sm group relative self-end"
            title="Ajuda"
          >
            <span className="absolute right-full mr-3 bg-card text-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-border pointer-events-none">Ajuda desta aba</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
          </button>

          <a
            href="https://wa.me/5517992573141?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20meu%20painel%20CheffNex!"
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 flex items-center justify-center hover:scale-110 transition-all group relative self-end"
            title="Suporte WhatsApp"
          >
            <span className="absolute right-full mr-3 bg-card text-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-border pointer-events-none">Falar com o Suporte</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
          </a>
        </div>
      </main>
    </div>
  );
};
