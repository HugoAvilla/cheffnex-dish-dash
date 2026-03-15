import { useMemo, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { HelpTutorialModal } from "@/components/admin/HelpTutorialModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, XCircle, Clock, ShoppingBag, ClipboardList, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDays, isAfter, isBefore, differenceInDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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
  const [userMetadata, setUserMetadata] = useState<any>(null);

  // Load user session metadata for payment status
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata) {
        setUserMetadata(session.user.user_metadata);
      }
    };
    fetchSession();
  }, []);

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

  const ingredients = [
    { id: "1", name: "Farinha de Trigo Premium", unit: "KG", current_stock: 250, min_stock: 50, category: "Massa", unit_value: 4.5, expiration_date: "2026-12-31", cost_price: 4.5 },
    { id: "2", name: "Queijo Mussarela ralado", unit: "KG", current_stock: 120, min_stock: 30, category: "Laticínios", unit_value: 35.9, expiration_date: "2026-05-10", cost_price: 35.9 },
    { id: "3", name: "Tomate Pelati Italiano", unit: "Lata", current_stock: 400, min_stock: 80, category: "Hortifruti", unit_value: 12.0, expiration_date: "2027-01-15", cost_price: 12.0 },
    { id: "4", name: "Calabresa Defumada", unit: "KG", current_stock: 80, min_stock: 20, category: "Frios", unit_value: 28.5, expiration_date: "2026-06-20", cost_price: 28.5 },
    { id: "5", name: "Manjericão Fresco", unit: "Maço", current_stock: 0, min_stock: 5, category: "Hortifruti", unit_value: 3.5, expiration_date: "2026-03-20", cost_price: 3.5 },
    { id: "6", name: "Azeite Trufado", unit: "L", current_stock: 2, min_stock: 5, category: "Óleos", unit_value: 150.0, expiration_date: "2026-11-01", cost_price: 150.0 },
    { id: "7", name: "Cebola Roxa", unit: "KG", current_stock: 10, min_stock: 15, category: "Hortifruti", unit_value: 6.0, expiration_date: "2026-04-10", cost_price: 6.0 },
  ];

  const activeProductsCount = 45;

  const todayOrdersCount = 127;

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
      if (i.cost_price != null && i.cost_price > 0) {
        return sum + (Number(i.cost_price) * Number(i.current_stock));
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

  const stockByCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of ingredients) {
      const cat = item.category || "Outros";
      if (!map[cat]) map[cat] = 0;
      map[cat] += (Number(item.cost_price || 0) * Number(item.current_stock));
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [ingredients]);

  const stockStatusData = useMemo(() => {
    const normal = metrics.total - metrics.outOfStock - metrics.lowStock;
    return [
      { name: "Normal", value: normal, color: "hsl(var(--success))" },
      { name: "Estoque Baixo", value: metrics.lowStock, color: "hsl(var(--warning))" },
      { name: "Sem Estoque", value: metrics.outOfStock, color: "hsl(var(--destructive))" },
    ].filter(d => d.value > 0);
  }, [metrics]);

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

  // Payment Warning Logic
  const getPaymentWarning = () => {
    if (!userMetadata) return null;

    const status = userMetadata.status;
    const declinedAt = userMetadata.payment_declined_at;

    if (status === "payment_declined" && declinedAt) {
      const declineDate = new Date(declinedAt);
      const deadlineDate = addDays(declineDate, 5);
      const daysLeft = differenceInDays(deadlineDate, now);

      if (daysLeft > 0) {
        return (
          <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400 mb-6">
            <AlertTriangle className="h-5 w-5 !text-yellow-600 dark:!text-yellow-500" />
            <AlertTitle className="text-lg font-semibold">Aviso de Pagamento Pendente</AlertTitle>
            <AlertDescription>
              Identificamos uma falha no seu último pagamento. Você tem <strong>{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</strong> para regularizar sua assinatura antes do bloqueio da plataforma.
            </AlertDescription>
          </Alert>
        );
      } else {
        return (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Assinatura Suspensa</AlertTitle>
            <AlertDescription>
              O prazo de 5 dias para regularização do pagamento expirou. Sua assinatura encontra-se com restrições. Por favor, regularize o pagamento imediatamente.
            </AlertDescription>
          </Alert>
        );
      }
    }

    // Fallback if somehow just marked as blocked strictly
    if (status === "blocked") {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Acesso Restrito</AlertTitle>
          <AlertDescription>
            Sua conta encontra-se bloqueada. Por favor, entre em contato ou regularize pendências imediatamente.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <AdminLayout>
      <HelpTutorialModal
        tutorialKey="admin_dashboard"
        title="Dashboard"
        steps={[
          { title: "Bem-vindo ao Dashboard!", description: "Aqui você tem uma visão geral do seu restaurante, incluindo métricas importantes de pedidos, estoque e faturamento." },
          { title: "Métricas Rápidas", description: "Os cartões no topo mostram o total de pedidos do dia atual, valor em estoque e alertas críticos (sem estoque ou próximo do vencimento)." },
          { title: "Estoque Detalhado", description: "Mais abaixo, você acompanha as tabelas detalhadas com os insumos que requerem atenção imediata." }
        ]}
      />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

        {getPaymentWarning()}

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
                <div className={`rounded-lg ${kpi.bgClass} p-2.5 shrink-0`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p 
                    className={`text-xl font-bold truncate ${kpi.valueClass}`}
                    title={
                      kpi.isMonetary 
                        ? `R$ ${Number(kpi.value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : String(kpi.value)
                    }
                  >
                    {kpi.isMonetary
                      ? `R$ ${Number(kpi.value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={kpi.label}>{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Valor em Estoque por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockByCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `R$ ${val}`} 
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Status dos Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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