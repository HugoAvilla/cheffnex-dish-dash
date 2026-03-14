import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, ShieldAlert, Trash2, FileDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const MASTER_DEV_EMAIL = "hg.lavila@gmail.com";

interface DiagnosticRow {
    id: string;
    user_id: string;
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
    profiles?: {
        full_name: string | null;
    } | null;
}

export default function MasterDiagnostics() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Security layer at component level
    if (!authLoading && user?.email?.toLowerCase() !== MASTER_DEV_EMAIL) {
        return <Navigate to="/admin" replace />;
    }

    const { data: diagnostics, isLoading, error } = useQuery({
        queryKey: ["master-diagnostics"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("pesquisa_diagnostico_clientes")
                .select("*, profiles:user_id(full_name)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            // Need to cast because Supabase array type issues on joins
            return (data as any) as DiagnosticRow[];
        },
        enabled: !!user && user.email?.toLowerCase() === MASTER_DEV_EMAIL,
    });

    const exportToCSV = (rows: DiagnosticRow[], filename: string) => {
        if (!rows || rows.length === 0) return;

        try {
            // Include 'nome' from profiles explicitly
            const headersList = ["nome_usuario", ...Object.keys(rows[0]).filter(k => k !== "profiles")];
            const headers = headersList.join(",");

            const csvRows = rows.map(row => {
                const rowValues = headersList.map(header => {
                    if (header === "nome_usuario") {
                        const name = row.profiles?.full_name || row.user_id;
                        return `"${name.replace(/"/g, '""')}"`;
                    }
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
        const nameClean = (row.profiles?.full_name || "usuario").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
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
                        Respostas formatadas em Segmentação para Tráfego Pago (Google Ads / Meta Ads).
                    </p>
                </div>
                <Button onClick={handleExportAllCSV} disabled={isExporting} className="gap-2 shadow-sm bg-green-600 hover:bg-green-700">
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Baixar TODOS em CSV
                </Button>
            </div>

            <Card className="shadow-sm border-border">
                <CardContent className="p-0">
                    <div className="rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="whitespace-nowrap min-w-[150px]">Nome & Data</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[150px]">Perfil (Idade/Gênero)</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Geografia & Renda</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Emprego & Educação</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[180px]">Status Familiar</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[220px]">Interesses / Origem</TableHead>
                                    <TableHead className="whitespace-nowrap text-center">Bônus</TableHead>
                                    <TableHead className="whitespace-nowrap text-right min-w-[120px]">Ações</TableHead>
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
                                                <div className="font-medium">{row.profiles?.full_name || "Sem nome"}</div>
                                                <div className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString("pt-BR")}</div>
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
                                            <TableCell>
                                                <div className="text-sm truncate max-w-[200px]" title={row.como_conheceu}>{row.como_conheceu || "-"}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={row.influencia_compra}>{row.influencia_compra || "-"}</div>
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
        </div>
    );
}
