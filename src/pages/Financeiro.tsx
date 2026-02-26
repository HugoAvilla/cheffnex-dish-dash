import { useState } from "react";
import {
  Plus, ArrowUpRight, ArrowDownRight, Wallet,
  TrendingUp, Eye, EyeOff, ShoppingBag, Package,
  DollarSign, BarChart3, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, subDays, startOfMonth, endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { AddExpenseModal } from "@/components/financeiro/AddExpenseModal";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  order_type: string;
  created_at: string;
}

interface StockEntry {
  id: string;
  quantity: number;
  cost_price: number;
  created_at: string;
  ingredients: { name: string; unit: string } | null;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: string;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function brl(value: number, hidden = false) {
  if (hidden) return "••••••";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  PIX: "PIX",
};

const PAYMENT_COLORS: Record<string, string> = {
  Dinheiro: "#3b82f6",
  PIX: "#22c55e",
  Cartão: "#8b5cf6",
  Outros: "#6b7280",
};

// ─── Component ─────────────────────────────────────────────────────────────────

const Financeiro = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();
  const [showValues, setShowValues] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // ── Orders (revenue) ──────────────────────────────────────────────────────
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["financeiro-orders", restaurantId, monthStart],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_amount, status, payment_method, order_type, created_at")
        .eq("restaurant_id", restaurantId)
        .neq("status", "CANCELLED")
        .gte("created_at", `${monthStart}T00:00:00`)
        .lte("created_at", `${monthEnd}T23:59:59`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!restaurantId,
  });

  // ── Stock entries (cost) ───────────────────────────────────────────────────
  const { data: stockEntries = [], isLoading: stockLoading } = useQuery({
    queryKey: ["financeiro-stock", restaurantId, monthStart],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("stock_entries")
        .select("id, quantity, cost_price, created_at, ingredients(name, unit)")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", `${monthStart}T00:00:00`)
        .lte("created_at", `${monthEnd}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as StockEntry[];
    },
    enabled: !!restaurantId,
  });

  // ── Expenses (manual outflows) ────────────────────────────────────────────
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["financeiro-expenses", restaurantId, monthStart],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
    enabled: !!restaurantId,
  });

  // ── Delete expense mutation ───────────────────────────────────────────────
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Despesa excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["financeiro-expenses"] });
    },
    onError: () => {
      toast.error("Erro ao excluir despesa");
    },
  });

  const isLoading = ordersLoading || stockLoading || expensesLoading;

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const totalCMV = stockEntries.reduce((s, e) => s + e.quantity * e.cost_price, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCosts = totalCMV + totalExpenses;
  const lucroLiquido = totalRevenue - totalCosts;
  const ticketMedio = orders.length > 0 ? totalRevenue / orders.length : 0;

  // ── Chart: last 7 days revenue vs cost ──────────────────────────────────
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");

    const dayRevenue = orders
      .filter((o) => o.created_at.startsWith(dateStr))
      .reduce((s, o) => s + o.total_amount, 0);

    const dayCost = stockEntries
      .filter((e) => e.created_at.startsWith(dateStr))
      .reduce((s, e) => s + e.quantity * e.cost_price, 0);

    const dayExpenses = expenses
      .filter((e) => e.expense_date === dateStr)
      .reduce((s, e) => s + e.amount, 0);

    return {
      date: format(date, "dd/MM"),
      receita: dayRevenue,
      custo: dayCost + dayExpenses,
      lucro: dayRevenue - dayCost - dayExpenses,
    };
  });

  // ── Payment method breakdown ─────────────────────────────────────────────
  const paymentMap: Record<string, number> = {};
  orders.forEach((o) => {
    const label = PAYMENT_LABELS[o.payment_method] || o.payment_method || "Outros";
    paymentMap[label] = (paymentMap[label] || 0) + o.total_amount;
  });
  const paymentData = Object.entries(paymentMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: PAYMENT_COLORS[name] || "#6b7280",
    }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-80" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })} — visão geral do mês
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowValues(!showValues)}>
              {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>
            <Button onClick={() => setExpenseModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar Despesa
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <div className="p-1.5 rounded-full bg-success/10">
                  <ArrowUpRight className="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--success))]">
                {brl(totalRevenue, !showValues)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{orders.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Custos Totais</p>
                <div className="p-1.5 rounded-full bg-destructive/10">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {brl(totalCosts, !showValues)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CMV + Despesas
              </p>
            </CardContent>
          </Card>

          <Card className={lucroLiquido >= 0 ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                <div className="p-1.5 rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? "text-primary" : "text-destructive"}`}>
                {brl(lucroLiquido, !showValues)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Margem:{" "}
                {totalRevenue > 0
                  ? `${((lucroLiquido / totalRevenue) * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <div className="p-1.5 rounded-full bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold">{brl(ticketMedio, !showValues)}</p>
              <p className="text-xs text-muted-foreground mt-1">por pedido</p>
            </CardContent>
          </Card>
        </div>

        {/* Sub-cards: CMV vs Despesas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-[hsl(var(--warning))]/10">
                <Package className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CMV (Custo de Estoque)</p>
                <p className="text-xl font-bold">{brl(totalCMV, !showValues)}</p>
                <p className="text-xs text-muted-foreground">
                  {stockEntries.length} entradas de estoque no mês
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <ShoppingBag className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas Operacionais</p>
                <p className="text-xl font-bold">{brl(totalExpenses, !showValues)}</p>
                <p className="text-xs text-muted-foreground">
                  {expenses.length} despesas registradas no mês
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart: 7 days evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Evolução dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [brl(value), ""]}
                  />
                  <Line type="monotone" dataKey="receita" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} name="Receita" />
                  <Line type="monotone" dataKey="custo" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Custos" />
                  <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} name="Lucro" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center mt-2">
              {[
                { label: "Receita", color: "hsl(var(--success))" },
                { label: "Custos", color: "hsl(var(--destructive))" },
                { label: "Lucro", color: "hsl(var(--primary))" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum pedido no período
              </p>
            ) : (
              <div className="space-y-3">
                {paymentData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm font-bold">{brl(item.value, !showValues)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                      {totalRevenue > 0 ? `${((item.value / totalRevenue) * 100).toFixed(0)}%` : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Despesas do Mês</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setExpenseModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma despesa registrada este mês</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setExpenseModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Registrar Despesa
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-destructive/10">
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {expense.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(expense.expense_date + "T12:00:00"), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-destructive text-sm">
                        -{brl(expense.amount, !showValues)}
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja excluir a despesa "{expense.description}" de {brl(expense.amount)}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteExpenseMutation.mutate(expense.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modals */}
      <AddExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["financeiro-expenses"] })}
      />
    </AdminLayout>
  );
};

export default Financeiro;
