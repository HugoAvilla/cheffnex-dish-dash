import { useState } from "react";
import { Search, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ReportConfigModal } from "@/components/relatorios/ReportConfigModal";

export interface ReportType {
  id: string;
  name: string;
  description: string;
  group: "pedidos" | "financeiro" | "estoque" | "cardapio";
  formats: string[];
  needsDateRange?: boolean;
}

export const reportTypes: ReportType[] = [
  { id: "pedidos_periodo", name: "Pedidos por Período", description: "Todos os pedidos realizados em um intervalo de datas", group: "pedidos", formats: ["pdf"], needsDateRange: true },
  { id: "pedidos_status", name: "Pedidos por Status", description: "Distribuição de pedidos por status (Novo, Preparando, Entregue...)", group: "pedidos", formats: ["pdf"], needsDateRange: true },
  { id: "pedidos_forma_pagamento", name: "Pedidos por Forma de Pagamento", description: "Receita agrupada por método de pagamento", group: "pedidos", formats: ["pdf"], needsDateRange: true },
  { id: "pedidos_tipo", name: "Pedidos por Tipo de Entrega", description: "Comparativo entre delivery, retirada e consumo local", group: "pedidos", formats: ["pdf"], needsDateRange: true },
  { id: "faturamento_periodo", name: "Faturamento por Período", description: "Receita total diária, semanal ou mensal", group: "financeiro", formats: ["pdf"], needsDateRange: true },
  { id: "ticket_medio", name: "Ticket Médio", description: "Valor médio por pedido no período selecionado", group: "financeiro", formats: ["pdf"], needsDateRange: true },
  { id: "cmv_diario", name: "CMV - Custo de Mercadoria Vendida", description: "Custo dos ingredientes consumidos nas vendas", group: "financeiro", formats: ["pdf"], needsDateRange: true },
  { id: "estoque_atual", name: "Estoque Atual", description: "Situação atual de todos os ingredientes em estoque", group: "estoque", formats: ["pdf"], needsDateRange: false },
  { id: "estoque_critico", name: "Ingredientes em Estoque Crítico", description: "Itens zerados ou abaixo do mínimo configurado", group: "estoque", formats: ["pdf"], needsDateRange: false },
  { id: "estoque_vencimento", name: "Ingredientes por Vencimento", description: "Ingredientes próximos ao vencimento nos próximos 7 dias", group: "estoque", formats: ["pdf"], needsDateRange: false },
  { id: "entradas_estoque", name: "Entradas de Estoque", description: "Histórico de todas as entradas de ingredientes registradas", group: "estoque", formats: ["pdf"], needsDateRange: true },
  { id: "produtos_mais_vendidos", name: "Produtos Mais Vendidos", description: "Ranking dos produtos com maior volume de vendas", group: "cardapio", formats: ["pdf"], needsDateRange: true },
  { id: "produtos_por_categoria", name: "Vendas por Categoria", description: "Receita e volume de cada categoria do cardápio", group: "cardapio", formats: ["pdf"], needsDateRange: true },
  { id: "extras_mais_pedidos", name: "Extras Mais Pedidos", description: "Adicionais e complementos mais solicitados pelos clientes", group: "cardapio", formats: ["pdf"], needsDateRange: true },
];

const GROUP_LABELS: Record<ReportType["group"], { label: string; colorClass: string; dotColor: string }> = {
  pedidos: { label: "Pedidos", colorClass: "border-accent/30 bg-accent/5", dotColor: "bg-accent" },
  financeiro: { label: "Financeiro", colorClass: "border-success/30 bg-success/5", dotColor: "bg-[hsl(var(--success))]" },
  estoque: { label: "Estoque", colorClass: "border-warning/30 bg-warning/5", dotColor: "bg-[hsl(var(--warning))]" },
  cardapio: { label: "Cardápio", colorClass: "border-primary/30 bg-primary/5", dotColor: "bg-primary" },
};

const Relatorios = () => {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [activeTab, setActiveTab] = useState("relatorios");

  const filteredReports = reportTypes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedReports = filteredReports.reduce(
    (acc, report) => {
      if (!acc[report.group]) acc[report.group] = [];
      acc[report.group].push(report);
      return acc;
    },
    {} as Record<string, ReportType[]>
  );

  const groupOrder: ReportType["group"][] = ["pedidos", "financeiro", "estoque", "cardapio"];

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gere relatórios detalhados para análise do seu restaurante
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="relatorios" className="gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="relatorios" className="space-y-6 mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar relatório..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupOrder.map((group) => {
                const reports = groupedReports[group];
                if (!reports || reports.length === 0) return null;
                const groupConfig = GROUP_LABELS[group];

                return (
                  <Card key={group} className={`border ${groupConfig.colorClass}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${groupConfig.dotColor}`} />
                        <CardTitle className="text-base">{groupConfig.label}</CardTitle>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {reports.length} relatório{reports.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reports.map((report) => (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className="w-full p-3 rounded-lg bg-background hover:bg-muted/60 border border-border/50 hover:border-border transition-all text-left flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-muted">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm leading-tight">{report.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{report.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <div className="flex gap-1">
                              {report.formats.map((fmt) => (
                                <Badge key={fmt} variant="outline" className="text-[10px] uppercase px-1.5">{fmt}</Badge>
                              ))}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum relatório encontrado para "{search}"</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ReportConfigModal
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
          report={selectedReport}
        />
      </div>
    </AdminLayout>
  );
};

export default Relatorios;
