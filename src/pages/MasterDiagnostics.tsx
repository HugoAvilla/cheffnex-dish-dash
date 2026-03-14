import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const MASTER_DEV_EMAIL = "Hg.lavila@gmail.com";

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
}

export default function MasterDiagnostics() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    // Security layer at component level
    if (!authLoading && user?.email !== MASTER_DEV_EMAIL) {
        return <Navigate to="/admin" replace />;
    }

    const { data: diagnostics, isLoading, error } = useQuery({
        queryKey: ["master-diagnostics"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("pesquisa_diagnostico_clientes")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as DiagnosticRow[];
        },
        enabled: !!user && user.email === MASTER_DEV_EMAIL,
    });

    const handleExportCSV = () => {
        if (!diagnostics || diagnostics.length === 0) {
            toast({
                title: "Aviso",
                description: "Não há dados para exportar.",
                variant: "destructive",
            });
            return;
        }

        setIsExporting(true);
        try {
            // Get all headers from the first object
            const headers = Object.keys(diagnostics[0]).join(",");

            // Convert rows to CSV string
            const csvRows = diagnostics.map(row => {
                return Object.values(row).map(value => {
                    // Escape quotes and format strings for CSV
                    if (typeof value === "string") {
                        const escaped = value.replace(/"/g, '""');
                        return `"${escaped}"`;
                    }
                    return value;
                }).join(",");
            });

            const csvContent = [headers, ...csvRows].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `diagnosticos_cheffnex_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Sucesso",
                description: "O arquivo CSV foi baixado com sucesso.",
            });
        } catch (err) {
            console.error(err);
            toast({
                title: "Erro na exportação",
                description: "Infelizmente houve um erro ao processar o CSV.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
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
                        Visualização exclusiva de todos os dados do Onboarding/Wizard. Respostas brutas para BI e Ads.
                    </p>
                </div>
                <Button onClick={handleExportCSV} disabled={isExporting} className="gap-2 shadow-sm">
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Exportar para CSV (Excel)
                </Button>
            </div>

            <Card className="shadow-sm border-border">
                <CardContent className="p-0">
                    <div className="rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">Data</TableHead>
                                    <TableHead className="whitespace-nowrap">ID Usuário</TableHead>
                                    <TableHead className="whitespace-nowrap">Idade</TableHead>
                                    <TableHead className="whitespace-nowrap">Renda Mensal</TableHead>
                                    <TableHead className="whitespace-nowrap">Emprego</TableHead>
                                    <TableHead className="whitespace-nowrap">Dificuldades/Medos</TableHead>
                                    <TableHead className="whitespace-nowrap">Bônus Resgatado?</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!diagnostics || diagnostics.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Nenhum diagnóstico preenchido até o momento.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    diagnostics.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(row.created_at).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs opacity-70">
                                                {row.user_id.split("-")[0]}...
                                            </TableCell>
                                            <TableCell>{row.idade || "-"}</TableCell>
                                            <TableCell>{row.renda_mensal || "-"}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={row.emprego_atual}>
                                                {row.emprego_atual || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[250px] truncate" title={row.dificuldades_medos}>
                                                {row.dificuldades_medos || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {row.bonus_resgatado ? (
                                                    <span className="text-green-600 font-medium text-xs bg-green-100 px-2 py-1 rounded">Sim</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Não</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground max-w-2xl">
                * A tabela exibe apenas colunas de destaque para performance visual. Ao clicar em "Exportar para CSV", TODAS as 17 respostas incluindo textos longos (Objetivos, Sonhos, Ferramentas) serão baixadas.
            </p>
        </div>
    );
}
