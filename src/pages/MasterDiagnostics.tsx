import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, ShieldAlert, Trash2, FileDown, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const MASTER_DEV_EMAIL = "hg.lavila@gmail.com";

interface DiagnosticRow {
    id: string;
    user_id: string;
    nome_pagamento: string | null;
    email_pagamento: string | null;
    idade: string;
    genero: string;
    cidade_estado_pais: string;
    renda_mensal: string;
    status_parental: string;
    estado_civil: string;
    escolaridade: string;
    status_proprietario: string;
    emprego_atual: string;
    como_conheceu: string;
    tempo_conhece: string;
    comprou_similar: string;
    influencia_compra: string;
    sobre_voce: string;
    objetivos: string;
    sonhos: string;
    dificuldades_medos: string;
    ferramenta_desejada: string;
    bonus_resgatado: boolean;
    created_at: string;
}

const generateChartData = (data: DiagnosticRow[], field: keyof DiagnosticRow) => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.forEach(row => {
        let val = row[field];
        if (typeof val === 'boolean') val = val ? 'Sim' : 'Não';
        if (!val || val === '') val = 'Não Informado';
        const strVal = String(val);
        counts[strVal] = (counts[strVal] || 0) + 1;
    });

    const total = data.length;
    return Object.entries(counts)
        .map(([name, quant]) => ({
            name,
            quantidade: quant,
            percentual: total > 0 ? ((quant / total) * 100).toFixed(1) : "0.0"
        }))
        .sort((a, b) => a.quantidade - b.quantidade);
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card text-card-foreground p-3 border border-border shadow-md rounded-md z-50">
                <p className="font-semibold text-sm mb-1">{payload[0].payload.name}</p>
                <p className="text-sm text-primary">Qtd: {payload[0].value}</p>
                <p className="text-sm text-muted-foreground">{payload[0].payload.percentual}% do total</p>
            </div>
        );
    }
    return null;
};

export default function MasterDiagnostics() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [viewingRow, setViewingRow] = useState<DiagnosticRow | null>(null);

    // Security layer at component level
    if (!authLoading && user?.email?.toLowerCase() !== MASTER_DEV_EMAIL) {
        return <Navigate to="/admin" replace />;
    }

    const { data: diagnostics, isLoading, error } = useQuery({
        queryKey: ["master-diagnostics"],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_master_diagnostics');

            if (error) throw error;
            return (data as any) as DiagnosticRow[];
        },
        enabled: !!user && user.email?.toLowerCase() === MASTER_DEV_EMAIL,
    });

    const exportToCSV = (rows: DiagnosticRow[], filename: string) => {
        if (!rows || rows.length === 0) return;

        try {
            const headersList = Object.keys(rows[0]);
            const headers = headersList.join(",");

            const csvRows = rows.map(row => {
                const rowValues = headersList.map(header => {
                    const value = (row as any)[header];
                    if (typeof value === "string") {
                        const escaped = value.replace(/"/g, '""');
                        return `"${escaped}"`;
                    }
                    return value;
                });
                return rowValues.join(",");
            });

            const csvContent = [headers, ...csvRows].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Sucesso", description: "O arquivo CSV foi salvo." });
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha na exportação.", variant: "destructive" });
        }
    };

    const handleExportAllCSV = () => {
        if (!diagnostics || diagnostics.length === 0) {
            toast({ title: "Aviso", description: "Não há dados para exportar.", variant: "destructive" });
            return;
        }
        setIsExporting(true);
        exportToCSV(diagnostics, `diagnosticos_todos_${new Date().toISOString().split('T')[0]}.csv`);
        setIsExporting(false);
    };

    const handleExportSingle = (row: DiagnosticRow) => {
        const nameClean = (row.nome_pagamento || "usuario").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        exportToCSV([row], `diagnostico_${nameClean}_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Você tem certeza absoluta que deseja excluir este diagnóstico? Isso não pode ser desfeito.")) {
            return;
        }
        setDeletingId(id);
        try {
            const { error } = await supabase.from("pesquisa_diagnostico_clientes").delete().eq("id", id);
            if (error) throw error;

            toast({ title: "Excluído com sucesso" });
            queryClient.invalidateQueries({ queryKey: ["master-diagnostics"] });
        } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="w-5 h-5" />
                            Erro de Permissão ou Conexão
                        </CardTitle>
                        <CardDescription>
                            {(error as any).message || "Não foi possível carregar os dados."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Dados (Developer)</h1>
                    <p className="text-muted-foreground mt-1">
                        Respostas formatadas em Segmentação para Tráfego Pago com Validação Nativa.
                    </p>
                </div>
                <Button onClick={handleExportAllCSV} disabled={isExporting} className="gap-2 shadow-sm bg-green-600 hover:bg-green-700">
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Baixar TODOS em CSV
                </Button>
            </div>

            <Tabs defaultValue="tabela" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="tabela">Tabela de Respostas</TabsTrigger>
                    <TabsTrigger value="graficos">Gráficos Analíticos</TabsTrigger>
                </TabsList>

                <TabsContent value="tabela" className="mt-0">
                    <Card className="shadow-sm border-border">
                        <CardContent className="p-0">
                            <div className="rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Nome & Email (Pagamento)</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[150px]">Perfil (Idade/Gênero)</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Geografia & Renda</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Emprego & Educação</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[180px]">Status Familiar</TableHead>
                                    <TableHead className="whitespace-nowrap text-center">Bônus</TableHead>
                                    <TableHead className="whitespace-nowrap text-right min-w-[150px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!diagnostics || diagnostics.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Nenhum diagnóstico preenchido até o momento.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    diagnostics.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <div className="font-medium">{row.nome_pagamento || "Sem nome"}</div>
                                                <div className="text-xs text-muted-foreground">{row.email_pagamento || "Sem e-mail"}</div>
                                                <div className="text-[10px] text-muted-foreground/80 mt-1">{new Date(row.created_at).toLocaleDateString("pt-BR")}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{row.idade || "-"}</div>
                                                <div className="text-xs text-muted-foreground">{row.genero || "-"}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm truncate max-w-[180px]" title={row.cidade_estado_pais}>{row.cidade_estado_pais || "-"}</div>
                                                <div className="text-xs text-muted-foreground">{row.renda_mensal || "-"}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm truncate max-w-[180px]" title={row.emprego_atual}>{row.emprego_atual || "-"}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={row.escolaridade}>{row.escolaridade || "-"}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{row.estado_civil || "-"}</div>
                                                <div className="text-xs text-muted-foreground">{row.status_parental || "-"}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {row.bonus_resgatado ? (
                                                    <span className="text-green-600 font-medium text-[10px] uppercase bg-green-100 px-2 py-1 rounded-full">OK</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-[10px] uppercase bg-muted px-2 py-1 rounded-full">Não</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                        title="Ver as 17 Respostas"
                                                        onClick={() => setViewingRow(row)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        title="Baixar CSV Deste Usuário"
                                                        onClick={() => handleExportSingle(row)}
                                                    >
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        title="Excluir Diagnóstico"
                                                        onClick={() => handleDelete(row.id)}
                                                        disabled={deletingId === row.id}
                                                    >
                                                        {deletingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="graficos" className="mt-0 space-y-6">
                {diagnostics && diagnostics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { k: "idade", label: "Idade" },
                            { k: "genero", label: "Gênero" },
                            { k: "cidade_estado_pais", label: "Localização" },
                            { k: "renda_mensal", label: "Renda Mensal" },
                            { k: "status_parental", label: "Status Parental" },
                            { k: "estado_civil", label: "Estado Civil" },
                            { k: "escolaridade", label: "Escolaridade" },
                            { k: "status_proprietario", label: "Status do Imóvel" },
                            { k: "emprego_atual", label: "Emprego Atual" },
                            { k: "como_conheceu", label: "Como Conheceu" },
                            { k: "tempo_conhece", label: "Tempo que Conhece" },
                            { k: "comprou_similar", label: "Comprou Similar" },
                            { k: "influencia_compra", label: "Influência de Compra" },
                        ].map(({ k, label }) => {
                            const cData = generateChartData(diagnostics, k as keyof DiagnosticRow);
                            return (
                                <Card key={k} className="shadow-sm border-border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{label}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={cData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
                                                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="shadow-sm border-border p-8 text-center text-muted-foreground">
                        Nenhum dado disponível para gerar gráficos.
                    </Card>
                )}
            </TabsContent>
        </Tabs>

            {/* View Details Modal */}
            <Dialog open={!!viewingRow} onOpenChange={(open) => !open && setViewingRow(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>As 17 Respostas do Diagnóstico</DialogTitle>
                        <DialogDescription>
                            Usuário: <strong>{viewingRow?.nome_pagamento}</strong> ({viewingRow?.email_pagamento})
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 overflow-y-auto pr-4 mt-4 text-sm">
                        {viewingRow && (
                            <div className="space-y-6 pb-6">
                                <div>
                                    <h3 className="font-semibold text-primary border-b pb-1 mb-3">1. Perfil e Geografia</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><span className="text-muted-foreground">Idade:</span> {viewingRow.idade}</div>
                                        <div><span className="text-muted-foreground">Gênero:</span> {viewingRow.genero}</div>
                                        <div><span className="text-muted-foreground">Localização:</span> {viewingRow.cidade_estado_pais}</div>
                                        <div><span className="text-muted-foreground">Renda Mensal:</span> {viewingRow.renda_mensal}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-primary border-b pb-1 mb-3">2. Status e Educação</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><span className="text-muted-foreground">Status Parental:</span> {viewingRow.status_parental}</div>
                                        <div><span className="text-muted-foreground">Estado Civil:</span> {viewingRow.estado_civil}</div>
                                        <div><span className="text-muted-foreground">Escolaridade:</span> {viewingRow.escolaridade}</div>
                                        <div><span className="text-muted-foreground">Status do Imóvel:</span> {viewingRow.status_proprietario}</div>
                                        <div className="col-span-2"><span className="text-muted-foreground">Emprego Atual:</span> {viewingRow.emprego_atual}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-primary border-b pb-1 mb-3">3. Origem e Comportamento</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><span className="text-muted-foreground">Como conheceu:</span> {viewingRow.como_conheceu}</div>
                                        <div><span className="text-muted-foreground">Tempo que conhece:</span> {viewingRow.tempo_conhece}</div>
                                        <div className="col-span-2"><span className="text-muted-foreground">Comprou similar antes:</span> {viewingRow.comprou_similar}</div>
                                        <div className="col-span-2"><span className="text-muted-foreground">Maior influência p/ comprar:</span> {viewingRow.influencia_compra}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-primary border-b pb-1 mb-3">4. Aprofundamento e Dores (Textos Longos)</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Sobre você e a história do restaurante:</span>
                                            <p className="bg-muted p-3 rounded-md italic">"{viewingRow.sobre_voce}"</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Principais objetivos com a plataforma:</span>
                                            <p className="bg-muted p-3 rounded-md italic">"{viewingRow.objetivos}"</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Maiores sonhos hoje:</span>
                                            <p className="bg-muted p-3 rounded-md italic">"{viewingRow.sonhos}"</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Maiores dificuldades ou medos:</span>
                                            <p className="bg-muted p-3 rounded-md italic">"{viewingRow.dificuldades_medos}"</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Ferramenta ou função desejada no futuro:</span>
                                            <p className="bg-muted p-3 rounded-md italic">"{viewingRow.ferramenta_desejada}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
