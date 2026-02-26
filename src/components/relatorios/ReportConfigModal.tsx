import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateReportPDF } from "@/lib/pdfGenerator";
import { format, subDays, addDays, isAfter } from "date-fns";
import type { ReportType } from "@/pages/Relatorios";

// ─── Types matching Supabase schema ────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  extras_json: any;
  products: { name: string; category_id: string | null } | null;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  order_type: string;
  payment_method: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_price: number;
  category: string;
  expiration_date: string | null;
}

interface StockEntry {
  id: string;
  quantity: number;
  cost_price: number;
  expiration_date: string | null;
  notes: string | null;
  created_at: string;
  ingredients: { name: string; unit: string } | null;
}

export interface ReportPDFData {
  title: string;
  period?: { start: string; end: string };
  columns: string[];
  rows: string[][];
  summary?: { label: string; value: string }[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function brl(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return dateStr;
  }
}

function fmtDateOnly(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  PREPARING: "Em Preparo",
  DISPATCHED: "Saiu p/ Entrega",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

// ✅ Corrigido: valores maiúsculos conforme banco de dados
const ORDER_TYPE_LABELS: Record<string, string> = {
  DELIVERY: "Delivery",
  LOCAL: "Retirada/Local",
};

// ✅ Corrigido: valores maiúsculos conforme banco de dados
const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  PIX: "PIX",
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ReportConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportType | null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ReportConfigModal({
  open,
  onOpenChange,
  report,
}: ReportConfigModalProps) {
  const { restaurantId } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    }
  }, [open]);

  // ── Report generators ──────────────────────────────────────────────────────

  async function generatePedidosPeriodo(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId!)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const orders = (data || []) as Order[];
    const total = orders.reduce((s, o) => s + o.total_amount, 0);

    const rows = orders.map((o, i) => [
      (i + 1).toString(),
      fmtDate(o.created_at),
      o.customer_name,
      ORDER_TYPE_LABELS[o.order_type] || o.order_type,
      STATUS_LABELS[o.status] || o.status,
      PAYMENT_LABELS[o.payment_method] || o.payment_method,
      brl(o.total_amount),
    ]);

    return {
      title: "Pedidos por Período",
      period: { start: startDate, end: endDate },
      columns: ["#", "Data/Hora", "Cliente", "Tipo", "Status", "Pagamento", "Total"],
      rows,
      summary: [
        { label: "Total de Pedidos", value: orders.length.toString() },
        { label: "Receita Total", value: brl(total) },
        { label: "Ticket Médio", value: orders.length ? brl(total / orders.length) : brl(0) },
      ],
    };
  }

  async function generatePedidosStatus(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("orders")
      .select("status, total_amount")
      .eq("restaurant_id", restaurantId!)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`);

    if (error) throw error;

    const orders = (data || []) as Pick<Order, "status" | "total_amount">[];

    const byStatus: Record<string, { qty: number; total: number }> = {};
    orders.forEach((o) => {
      const key = STATUS_LABELS[o.status] || o.status;
      if (!byStatus[key]) byStatus[key] = { qty: 0, total: 0 };
      byStatus[key].qty += 1;
      byStatus[key].total += o.total_amount;
    });

    const rows = Object.entries(byStatus).map(([status, vals], i) => [
      (i + 1).toString(),
      status,
      vals.qty.toString(),
      brl(vals.total),
    ]);

    return {
      title: "Pedidos por Status",
      period: { start: startDate, end: endDate },
      columns: ["#", "Status", "Quantidade", "Valor Total"],
      rows,
      summary: [
        { label: "Total de Pedidos", value: orders.length.toString() },
        { label: "Receita Total", value: brl(orders.reduce((s, o) => s + o.total_amount, 0)) },
      ],
    };
  }

  async function generatePedidosFormaPagamento(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("orders")
      .select("payment_method, total_amount")
      .eq("restaurant_id", restaurantId!)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`);

    if (error) throw error;

    const orders = (data || []) as Pick<Order, "payment_method" | "total_amount">[];

    const byPayment: Record<string, { qty: number; total: number }> = {};
    orders.forEach((o) => {
      const key = PAYMENT_LABELS[o.payment_method] || o.payment_method;
      if (!byPayment[key]) byPayment[key] = { qty: 0, total: 0 };
      byPayment[key].qty += 1;
      byPayment[key].total += o.total_amount;
    });

    const grandTotal = orders.reduce((s, o) => s + o.total_amount, 0);

    const rows = Object.entries(byPayment)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([method, vals], i) => [
        (i + 1).toString(),
        method,
        vals.qty.toString(),
        brl(vals.total),
        grandTotal > 0 ? `${((vals.total / grandTotal) * 100).toFixed(1)}%` : "0%",
      ]);

    return {
      title: "Pedidos por Forma de Pagamento",
      period: { start: startDate, end: endDate },
      columns: ["#", "Forma de Pagamento", "Pedidos", "Total", "% Receita"],
      rows,
      summary: [
        { label: "Total de Pedidos", value: orders.length.toString() },
        { label: "Receita Total", value: brl(grandTotal) },
      ],
    };
  }

  async function generatePedidosTipo(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("orders")
      .select("order_type, total_amount")
      .eq("restaurant_id", restaurantId!)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`);

    if (error) throw error;

    const orders = (data || []) as Pick<Order, "order_type" | "total_amount">[];

    const byType: Record<string, { qty: number; total: number }> = {};
    orders.forEach((o) => {
      const key = ORDER_TYPE_LABELS[o.order_type] || o.order_type;
      if (!byType[key]) byType[key] = { qty: 0, total: 0 };
      byType[key].qty += 1;
      byType[key].total += o.total_amount;
    });

    const grandTotal = orders.reduce((s, o) => s + o.total_amount, 0);

    const rows = Object.entries(byType).map(([tipo, vals], i) => [
      (i + 1).toString(),
      tipo,
      vals.qty.toString(),
      brl(vals.total),
      grandTotal > 0 ? `${((vals.total / grandTotal) * 100).toFixed(1)}%` : "0%",
    ]);

    return {
      title: "Pedidos por Tipo de Entrega",
      period: { start: startDate, end: endDate },
      columns: ["#", "Tipo", "Pedidos", "Total", "% Receita"],
      rows,
      summary: [
        { label: "Total de Pedidos", value: orders.length.toString() },
        { label: "Receita Total", value: brl(grandTotal) },
      ],
    };
  }

  async function generateFaturamentoPeriodo(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("orders")
      .select("created_at, total_amount, status")
      .eq("restaurant_id", restaurantId!)
      .neq("status", "CANCELLED")
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const orders = (data || []) as Pick<Order, "created_at" | "total_amount" | "status">[];

    const byDay: Record<string, { qty: number; total: number }> = {};
    orders.forEach((o) => {
      const day = format(new Date(o.created_at), "dd/MM/yyyy");
      if (!byDay[day]) byDay[day] = { qty: 0, total: 0 };
      byDay[day].qty += 1;
      byDay[day].total += o.total_amount;
    });

    const rows = Object.entries(byDay).map(([day, vals], i) => [
      (i + 1).toString(),
      day,
      vals.qty.toString(),
      brl(vals.total),
      brl(vals.qty > 0 ? vals.total / vals.qty : 0),
    ]);

    const grandTotal = orders.reduce((s, o) => s + o.total_amount, 0);

    return {
      title: "Faturamento por Período",
      period: { start: startDate, end: endDate },
      columns: ["#", "Data", "Pedidos", "Faturamento", "Ticket Médio"],
      rows,
      summary: [
        { label: "Total de Pedidos", value: orders.length.toString() },
        { label: "Faturamento Total", value: brl(grandTotal) },
        { label: "Ticket Médio Geral", value: orders.length ? brl(grandTotal / orders.length) : brl(0) },
      ],
    };
  }

  async function generateTicketMedio(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("orders")
      .select("created_at, total_amount, order_type, status")
      .eq("restaurant_id", restaurantId!)
      .neq("status", "CANCELLED")
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`);

    if (error) throw error;

    const orders = (data || []) as Pick<Order, "created_at" | "total_amount" | "order_type" | "status">[];

    const byType: Record<string, { qty: number; total: number }> = {};
    orders.forEach((o) => {
      const key = ORDER_TYPE_LABELS[o.order_type] || o.order_type;
      if (!byType[key]) byType[key] = { qty: 0, total: 0 };
      byType[key].qty += 1;
      byType[key].total += o.total_amount;
    });

    const rows = Object.entries(byType).map(([tipo, vals], i) => [
      (i + 1).toString(),
      tipo,
      vals.qty.toString(),
      brl(vals.total),
      brl(vals.qty > 0 ? vals.total / vals.qty : 0),
    ]);

    const grandTotal = orders.reduce((s, o) => s + o.total_amount, 0);

    return {
      title: "Ticket Médio por Tipo de Pedido",
      period: { start: startDate, end: endDate },
      columns: ["#", "Tipo", "Pedidos", "Receita Total", "Ticket Médio"],
      rows,
      summary: [
        { label: "Total de Pedidos", value: orders.length.toString() },
        { label: "Receita Total", value: brl(grandTotal) },
        { label: "Ticket Médio Geral", value: orders.length ? brl(grandTotal / orders.length) : brl(0) },
      ],
    };
  }

  async function generateCMV(): Promise<ReportPDFData> {
    const { data: entries, error } = await supabase
      .from("stock_entries")
      .select("*, ingredients(name, unit)")
      .eq("restaurant_id", restaurantId!)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: ordersData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("restaurant_id", restaurantId!)
      .neq("status", "CANCELLED")
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`);

    const totalRevenue = (ordersData || []).reduce((s: number, o: any) => s + o.total_amount, 0);
    const typedEntries = (entries || []) as StockEntry[];

    const rows = typedEntries.map((e, i) => [
      (i + 1).toString(),
      fmtDateOnly(e.created_at),
      e.ingredients?.name || "-",
      `${e.quantity} ${e.ingredients?.unit || "un"}`,
      brl(e.cost_price),
      brl(e.quantity * e.cost_price),
    ]);

    const totalCost = typedEntries.reduce((s, e) => s + e.quantity * e.cost_price, 0);

    return {
      title: "CMV - Custo de Mercadoria Vendida",
      period: { start: startDate, end: endDate },
      columns: ["#", "Data", "Ingrediente", "Quantidade", "Custo Unit.", "Custo Total"],
      rows,
      summary: [
        { label: "Total de Entradas", value: typedEntries.length.toString() },
        { label: "Custo Total (CMV)", value: brl(totalCost) },
        { label: "Faturamento no Período", value: brl(totalRevenue) },
        { label: "CMV%", value: totalRevenue > 0 ? `${((totalCost / totalRevenue) * 100).toFixed(1)}%` : "N/A" },
      ],
    };
  }

  async function generateEstoqueAtual(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("restaurant_id", restaurantId!)
      .order("category")
      .order("name");

    if (error) throw error;

    const ingredients = (data || []) as Ingredient[];

    function getStatusLabel(i: Ingredient) {
      if (i.current_stock === 0) return "Sem estoque";
      if (i.current_stock <= i.min_stock * 1.1) return "Estoque baixo";
      return "Normal";
    }

    const rows = ingredients.map((i, idx) => [
      (idx + 1).toString(),
      i.name,
      i.category,
      `${i.current_stock} ${i.unit}`,
      `${i.min_stock} ${i.unit}`,
      brl(i.cost_price),
      brl(i.current_stock * i.cost_price),
      getStatusLabel(i),
    ]);

    const totalValue = ingredients.reduce((s, i) => s + i.current_stock * i.cost_price, 0);

    return {
      title: "Estoque Atual",
      columns: ["#", "Ingrediente", "Categoria", "Estoque", "Mínimo", "Custo Unit.", "Valor Total", "Status"],
      rows,
      summary: [
        { label: "Total de Ingredientes", value: ingredients.length.toString() },
        { label: "Itens sem Estoque", value: ingredients.filter((i) => i.current_stock === 0).length.toString() },
        { label: "Itens com Estoque Baixo", value: ingredients.filter((i) => i.current_stock > 0 && i.current_stock <= i.min_stock * 1.1).length.toString() },
        { label: "Valor Total em Estoque", value: brl(totalValue) },
      ],
    };
  }

  async function generateEstoqueCritico(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("restaurant_id", restaurantId!)
      .order("current_stock", { ascending: true });

    if (error) throw error;

    const ingredients = (data || []) as Ingredient[];
    const critical = ingredients.filter((i) => i.current_stock <= i.min_stock * 1.1);

    const rows = critical.map((i, idx) => [
      (idx + 1).toString(),
      i.name,
      i.category,
      `${i.current_stock} ${i.unit}`,
      `${i.min_stock} ${i.unit}`,
      i.current_stock === 0 ? "Sem estoque" : "Estoque baixo",
    ]);

    return {
      title: "Ingredientes em Estoque Crítico",
      columns: ["#", "Ingrediente", "Categoria", "Estoque Atual", "Estoque Mínimo", "Situação"],
      rows,
      summary: [
        { label: "Total em Situação Crítica", value: critical.length.toString() },
        { label: "Sem Estoque", value: critical.filter((i) => i.current_stock === 0).length.toString() },
        { label: "Estoque Baixo", value: critical.filter((i) => i.current_stock > 0).length.toString() },
      ],
    };
  }

  async function generateEstoqueVencimento(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("restaurant_id", restaurantId!)
      .not("expiration_date", "is", null)
      .order("expiration_date", { ascending: true });

    if (error) throw error;

    const ingredients = (data || []) as Ingredient[];
    const now = new Date();
    const in7days = addDays(now, 7);

    const nearExpiry = ingredients.filter((i) => {
      if (!i.expiration_date) return false;
      const exp = new Date(i.expiration_date);
      return !isAfter(exp, in7days);
    });

    const rows = nearExpiry.map((i, idx) => {
      const exp = new Date(i.expiration_date!);
      const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return [
        (idx + 1).toString(),
        i.name,
        i.category,
        `${i.current_stock} ${i.unit}`,
        fmtDateOnly(i.expiration_date!),
        daysLeft <= 0 ? "Vencido!" : `${daysLeft} dia(s)`,
      ];
    });

    return {
      title: "Ingredientes por Vencimento (próximos 7 dias)",
      columns: ["#", "Ingrediente", "Categoria", "Estoque", "Vencimento", "Dias Restantes"],
      rows,
      summary: [
        { label: "Total em Alerta", value: nearExpiry.length.toString() },
        { label: "Já Vencidos", value: nearExpiry.filter((i) => new Date(i.expiration_date!).getTime() <= now.getTime()).length.toString() },
      ],
    };
  }

  async function generateEntradasEstoque(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("stock_entries")
      .select("*, ingredients(name, unit)")
      .eq("restaurant_id", restaurantId!)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const entries = (data || []) as StockEntry[];

    const rows = entries.map((e, i) => [
      (i + 1).toString(),
      fmtDateOnly(e.created_at),
      e.ingredients?.name || "-",
      `${e.quantity} ${e.ingredients?.unit || "un"}`,
      brl(e.cost_price),
      brl(e.quantity * e.cost_price),
      e.notes || "-",
    ]);

    const totalCost = entries.reduce((s, e) => s + e.quantity * e.cost_price, 0);

    return {
      title: "Entradas de Estoque",
      period: { start: startDate, end: endDate },
      columns: ["#", "Data", "Ingrediente", "Quantidade", "Custo Unit.", "Custo Total", "Observação"],
      rows,
      summary: [
        { label: "Total de Entradas", value: entries.length.toString() },
        { label: "Valor Total Investido", value: brl(totalCost) },
      ],
    };
  }

  async function generateProdutosMaisVendidos(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("order_items")
      .select("quantity, unit_price, products(name), orders!inner(created_at, status)")
      .eq("orders.restaurant_id", restaurantId!)
      .neq("orders.status", "CANCELLED")
      .gte("orders.created_at", `${startDate}T00:00:00`)
      .lte("orders.created_at", `${endDate}T23:59:59`);

    if (error) throw error;

    const items = (data || []) as any[];

    const byProduct: Record<string, { qty: number; total: number }> = {};
    items.forEach((item) => {
      const name = item.products?.name || "Produto removido";
      if (!byProduct[name]) byProduct[name] = { qty: 0, total: 0 };
      byProduct[name].qty += item.quantity;
      byProduct[name].total += item.quantity * item.unit_price;
    });

    const rows = Object.entries(byProduct)
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([name, vals], i) => [
        (i + 1).toString(),
        name,
        vals.qty.toString(),
        brl(vals.qty > 0 ? vals.total / vals.qty : 0),
        brl(vals.total),
      ]);

    const grandTotal = Object.values(byProduct).reduce((s, v) => s + v.total, 0);

    return {
      title: "Produtos Mais Vendidos",
      period: { start: startDate, end: endDate },
      columns: ["#", "Produto", "Qtd. Vendida", "Preço Médio", "Receita Total"],
      rows,
      summary: [
        { label: "Total de Produtos Distintos", value: rows.length.toString() },
        { label: "Receita Total", value: brl(grandTotal) },
      ],
    };
  }

  async function generateProdutosPorCategoria(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("order_items")
      .select("quantity, unit_price, products(name, categories(name)), orders!inner(created_at, status)")
      .eq("orders.restaurant_id", restaurantId!)
      .neq("orders.status", "CANCELLED")
      .gte("orders.created_at", `${startDate}T00:00:00`)
      .lte("orders.created_at", `${endDate}T23:59:59`);

    if (error) throw error;

    const items = (data || []) as any[];

    const byCategory: Record<string, { qty: number; total: number }> = {};
    items.forEach((item) => {
      const cat = item.products?.categories?.name || item.products?.category || "Sem categoria";
      if (!byCategory[cat]) byCategory[cat] = { qty: 0, total: 0 };
      byCategory[cat].qty += item.quantity;
      byCategory[cat].total += item.quantity * item.unit_price;
    });

    const grandTotal = Object.values(byCategory).reduce((s, v) => s + v.total, 0);

    const rows = Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, vals], i) => [
        (i + 1).toString(),
        cat,
        vals.qty.toString(),
        brl(vals.total),
        grandTotal > 0 ? `${((vals.total / grandTotal) * 100).toFixed(1)}%` : "0%",
      ]);

    return {
      title: "Vendas por Categoria",
      period: { start: startDate, end: endDate },
      columns: ["#", "Categoria", "Itens Vendidos", "Receita", "% do Total"],
      rows,
      summary: [
        { label: "Total de Categorias", value: rows.length.toString() },
        { label: "Receita Total", value: brl(grandTotal) },
      ],
    };
  }

  async function generateExtrasMaisPedidos(): Promise<ReportPDFData> {
    const { data, error } = await supabase
      .from("order_items")
      .select("extras_json, orders!inner(created_at, status)")
      .eq("orders.restaurant_id", restaurantId!)
      .neq("orders.status", "CANCELLED")
      .gte("orders.created_at", `${startDate}T00:00:00`)
      .lte("orders.created_at", `${endDate}T23:59:59`)
      .not("extras_json", "is", null);

    if (error) throw error;

    const items = (data || []) as any[];

    const byExtra: Record<string, { qty: number; total: number }> = {};
    items.forEach((item) => {
      const extras = item.extras_json;
      if (!extras || !Array.isArray(extras)) return;
      extras.forEach((extra: { name?: string; price?: number; quantity?: number }) => {
        if (!extra.name) return;
        const qty = extra.quantity || 1;
        const price = extra.price || 0;
        if (!byExtra[extra.name]) byExtra[extra.name] = { qty: 0, total: 0 };
        byExtra[extra.name].qty += qty;
        byExtra[extra.name].total += qty * price;
      });
    });

    const rows = Object.entries(byExtra)
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([name, vals], i) => [
        (i + 1).toString(),
        name,
        vals.qty.toString(),
        brl(vals.total),
      ]);

    return {
      title: "Extras Mais Pedidos",
      period: { start: startDate, end: endDate },
      columns: ["#", "Extra / Adicional", "Qtd. Pedida", "Receita Total"],
      rows,
      summary: [
        { label: "Total de Extras Distintos", value: rows.length.toString() },
        { label: "Receita Total com Extras", value: brl(Object.values(byExtra).reduce((s, v) => s + v.total, 0)) },
      ],
    };
  }

  // ── Handle generate ────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!report || !restaurantId) return;

    setGenerating(true);
    try {
      let pdfData: ReportPDFData;

      switch (report.id) {
        case "pedidos_periodo": pdfData = await generatePedidosPeriodo(); break;
        case "pedidos_status": pdfData = await generatePedidosStatus(); break;
        case "pedidos_forma_pagamento": pdfData = await generatePedidosFormaPagamento(); break;
        case "pedidos_tipo": pdfData = await generatePedidosTipo(); break;
        case "faturamento_periodo": pdfData = await generateFaturamentoPeriodo(); break;
        case "ticket_medio": pdfData = await generateTicketMedio(); break;
        case "cmv_diario": pdfData = await generateCMV(); break;
        case "estoque_atual": pdfData = await generateEstoqueAtual(); break;
        case "estoque_critico": pdfData = await generateEstoqueCritico(); break;
        case "estoque_vencimento": pdfData = await generateEstoqueVencimento(); break;
        case "entradas_estoque": pdfData = await generateEntradasEstoque(); break;
        case "produtos_mais_vendidos": pdfData = await generateProdutosMaisVendidos(); break;
        case "produtos_por_categoria": pdfData = await generateProdutosPorCategoria(); break;
        case "extras_mais_pedidos": pdfData = await generateExtrasMaisPedidos(); break;
        default:
          toast.error("Relatório não implementado");
          return;
      }

      generateReportPDF(pdfData);
      toast.success(`Relatório "${report.name}" gerado com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  if (!report) return null;

  const needsDateRange = report.needsDateRange !== false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            {report.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{report.description}</p>

          {needsDateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {!needsDateRange && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground border border-border/50">
              Este relatório reflete a situação atual do estoque, sem filtro por período.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
