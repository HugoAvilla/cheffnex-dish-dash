import { useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, XCircle, Clock, ShoppingBag, ClipboardList, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDays, isAfter, isBefore } from "date-fns";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  category: string;
  unit_value: number | null;
  expiration_date: string | null;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const Dashboard = () => {
  const { restaurantId } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      return data;
    },
  });

  // Fetch restaurant settings
  const { data: settings } = useQuery({
    queryKey: ["restaurant-settings", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return { expiry_alert_days: 1, low_stock_threshold: 10 };
      const { data, error } = await supabase
        .from("restaurants")
        .select("expiry_alert_days, low_stock_threshold")
        .eq("id", restaurantId)
        .single();
      if (error) return { expiry_alert_days: 1, low_stock_threshold: 10 };
      return {
        expiry_alert_days: (data as any).expiry_alert_days ?? 1,
        low_stock_threshold: (data as any).low_stock_threshold ?? 10,
      };
    },
    enabled: !!restaurantId,
  });

  const alertDays = settings?.expiry_alert_days ?? 1;
  const thresholdPercent = settings?.low_stock_threshold ?? 10;

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients-dashboard", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return (data as unknown as Ingredient[]) ?? [];
    },
    enabled: !!restaurantId,
  });

  const { data: activeProductsCount = 0 } = useQuery({
    queryKey: ["products-count", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!restaurantId,
  });

  const { data: todayOrdersCount = 0 } = useQuery({
    queryKey: ["orders-today", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .gte("created_at", today)
        .in("status", ["NEW", "PREPARING"]);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!restaurantId,
  });

  const now = new Date();
  const alertDate = addDays(now, alertDays);

  const metrics = useMemo(() => ({
    total: ingredients.length,
    outOfStock: ingredients.filter(i => i.current_stock === 0).length,
    lowStock: ingredients.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock * (1 + thresholdPercent / 100)).length,
    nearExpiry: ingredients.filter(i => {
      if (!i.expiration_date) return false;
      const exp = new Date(i.expiration_date);
      return isAfter(exp, now) && isBefore(exp, alertDate);
    }).length,
    stockValue: ingredients.reduce((sum, i) => {
      if (i.unit_value != null && i.unit_value > 0) {
        return sum + (Number(i.unit_value) * Number(i.current_stock));
      }
      return sum;
    }, 0),
  }), [ingredients, now, alertDate, thresholdPercent]);

  const outOfStockItems = useMemo(() => ingredients.filter(i => i.current_stock === 0), [ingredients]);
  const lowStockItems = useMemo(() => ingredients.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock * (1 + thresholdPercent / 100)), [ingredients, thresholdPercent]);
  const nearExpiryItems = useMemo(() => ingredients.filter(i => {
    if (!i.expiration_date) return false;
    const exp = new Date(i.expiration_date);
    return isAfter(exp, now) && isBefore(exp, alertDate);
  }), [ingredients, now, alertDate]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; outOfStock: number }> = {};
    for (const item of ingredients) {
      const cat = item.category || "Outros";
      if (!map[cat]) map[cat] = { total: 0, outOfStock: 0 };
      map[cat].total++;
      if (item.current_stock === 0) map[cat].outOfStock++;
    }
    return Object.entries(map).sort(([a], [b]) => {
      if (a === "Outros") return 1;
      if (b === "Outros") return -1;
      return a.localeCompare(b);
    });
  }, [ingredients]);

  const userName = profile?.full_name || "Admin";

  const kpiCards = [
    { label: "Total de Itens", value: metrics.total, icon: Package, bgClass: "bg-primary/10", iconClass: "text-primary", valueClass: "text-foreground", isMonetary: false },
    { label: "Produtos Ativos", value: activeProductsCount, icon: ShoppingBag, bgClass: "bg-accent/10", iconClass: "text-accent", valueClass: "text-foreground", isMonetary: false },
    { label: "Pedidos Hoje", value: todayOrdersCount, icon: ClipboardList, bgClass: "bg-primary/10", iconClass: "text-primary", valueClass: "text-foreground", isMonetary: false },
    { label: "Valor em Estoque", value: metrics.stockValue, icon: DollarSign, bgClass: "bg-[hsl(var(--success))]/10", iconClass: "text-[hsl(var(--success))]", valueClass: "text-[hsl(var(--success))]", isMonetary: true },
    { label: "Sem Estoque", value: metrics.outOfStock, icon: XCircle, bgClass: "bg-destructive/10", iconClass: "text-destructive", valueClass: "text-destructive", isMonetary: false },
    { label: "Estoque Baixo", value: metrics.lowStock, icon: AlertTriangle, bgClass: "bg-[hsl(var(--warning))]/10", iconClass: "text-[hsl(var(--warning))]", valueClass: "text-[hsl(var(--warning))]", isMonetary: false },
    { label: "Próx. Vencimento", value: metrics.nearExpiry, icon: Clock, bgClass: "bg-[hsl(var(--warning))]/10", iconClass: "text-[hsl(var(--warning))]", valueClass: "text-foreground", isMonetary: false },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {userName}!</h1>
          <p className="text-sm text-muted-foreground">Aqui está um resumo do seu estoque atual</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg ${kpi.bgClass} p-2.5`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconClass}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${kpi.valueClass}`}>
                    {kpi.isMonetary
                      ? `R$ ${Number(kpi.value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Estoque Baixo */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                <CardTitle className="text-base">Estoque Baixo</CardTitle>
                <Badge variant="secondary" className="ml-auto">{lowStockItems.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border max-h-60 overflow-y-auto">
                {lowStockItems.map(item => (
                  <div key={item.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-sm font-mono text-[hsl(var(--warning))]">
                      {Number(item.current_stock)} {item.unit.toLowerCase()}
                    </span>
                  </div>
                ))}
                {lowStockItems.length === 0 && <p className="text-sm text-muted-foreground py-3">Nenhum item com estoque baixo.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Sem Estoque */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-base">Sem Estoque</CardTitle>
                <Badge variant="destructive" className="ml-auto">{outOfStockItems.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border max-h-60 overflow-y-auto">
                {outOfStockItems.map(item => (
                  <div key={item.id} className="py-2">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} · 0 {item.unit.toLowerCase()} · Mín: {Number(item.min_stock)}
                    </p>
                  </div>
                ))}
                {outOfStockItems.length === 0 && <p className="text-sm text-muted-foreground py-3">Todos os itens têm estoque.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Próximo ao Vencimento */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" />
                <CardTitle className="text-base">Próx. Vencimento</CardTitle>
                <Badge variant="secondary" className="ml-auto">{nearExpiryItems.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border max-h-60 overflow-y-auto">
                {nearExpiryItems.map(item => (
                  <div key={item.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-xs font-mono text-destructive">
                      {item.expiration_date ? new Date(item.expiration_date + "T00:00:00").toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                ))}
                {nearExpiryItems.length === 0 && <p className="text-sm text-muted-foreground py-3">Nenhum item próximo ao vencimento.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categorias do Estoque */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Categorias do Estoque</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryStats.map(([cat, stats]) => (
              <Card key={cat}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">{cat}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.total === 1 ? "item" : "itens"}
                    {stats.outOfStock > 0 && (
                      <span className="text-destructive"> · {stats.outOfStock} sem estoque</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
            {categoryStats.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">Nenhum item cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;