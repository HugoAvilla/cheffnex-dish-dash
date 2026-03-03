import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Ticket, Plus, Trash2 } from "lucide-react";
import { HelpTutorialModal } from "@/components/admin/HelpTutorialModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminSettings = () => {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expiryAlertDays, setExpiryAlertDays] = useState(1);
    const [lowStockThreshold, setLowStockThreshold] = useState(10);

    // New Coupon State
    const [newCouponCode, setNewCouponCode] = useState("");
    const [newCouponType, setNewCouponType] = useState("percentage");
    const [newCouponValue, setNewCouponValue] = useState("");

    const { data: coupons = [], isLoading: loadingCoupons } = useQuery({
        queryKey: ["coupons", restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!restaurantId,
    });

    const addCouponMutation = useMutation({
        mutationFn: async () => {
            if (!newCouponCode || !newCouponValue) throw new Error("Preencha todos os campos do cupom.");
            const { error } = await supabase.from("coupons").insert({
                restaurant_id: restaurantId,
                code: newCouponCode.toUpperCase(),
                discount_type: newCouponType,
                discount_value: parseFloat(newCouponValue),
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
            setNewCouponCode("");
            setNewCouponValue("");
            toast.success("Cupom adicionado com sucesso!");
        },
        onError: (error) => toast.error(error.message),
    });

    const toggleCouponMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
            toast.success("Status do cupom alterado.");
        },
    });

    const deleteCouponMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("coupons").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
            toast.success("Cupom removido.");
        },
    });

    useEffect(() => {
        if (!restaurantId) return;
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from("restaurants")
                .select("expiry_alert_days, low_stock_threshold")
                .eq("id", restaurantId)
                .single();
            if (!error && data) {
                setExpiryAlertDays((data as any).expiry_alert_days ?? 1);
                setLowStockThreshold((data as any).low_stock_threshold ?? 10);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [restaurantId]);

    const handleSave = async () => {
        if (!restaurantId) return;
        setSaving(true);
        const { error } = await supabase
            .from("restaurants")
            .update({
                expiry_alert_days: expiryAlertDays,
                low_stock_threshold: lowStockThreshold,
            } as any)
            .eq("id", restaurantId);
        setSaving(false);
        if (error) {
            toast.error("Erro ao salvar: " + error.message);
        } else {
            toast.success("Configurações salvas com sucesso!");
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <HelpTutorialModal
                tutorialKey="admin_settings"
                title="Configurações Gerais"
                steps={[
                    { title: "Configurações da Loja", description: "Aqui você ajusta o comportamento geral da sua loja." },
                    { title: "Alertas de Estoque", description: "Configure a régua financeira e os dias para alerta de vencimento de insumos ou quando seu estoque de algo estiver perigosamente baixo." },
                    { title: "Cupons de Desconto", description: "Você também gerenciará seus cupons de descontos para os clientes nesta área (após criados)." },
                ]}
            />
            <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Alertas de Estoque</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Expiry Alert Days */}
                        <div className="grid gap-2">
                            <Label htmlFor="expiry-days">Dias para alerta de vencimento</Label>
                            <p className="text-xs text-muted-foreground">
                                Quando um item estiver a X dias de vencer, será destacado como alerta.
                            </p>
                            <div className="flex items-center gap-3 max-w-xs">
                                <Input
                                    id="expiry-days"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={expiryAlertDays}
                                    onChange={(e) => setExpiryAlertDays(Math.max(1, Number(e.target.value)))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">dia(s) antes</span>
                            </div>
                        </div>

                        {/* Low Stock Threshold */}
                        <div className="grid gap-2">
                            <Label htmlFor="low-stock">Margem de estoque baixo (%)</Label>
                            <p className="text-xs text-muted-foreground">
                                O estoque é considerado "baixo" quando está até X% acima do estoque mínimo.
                            </p>
                            <div className="flex items-center gap-3 max-w-xs">
                                <Input
                                    id="low-stock"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">% acima do mínimo</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                </div>

                {/* Coupons Management Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-primary" />
                            Cupons de Desconto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="grid gap-2 flex-grow">
                                <Label htmlFor="coupon-code">Código</Label>
                                <Input
                                    id="coupon-code"
                                    placeholder="Ex: BEMVINDO10"
                                    value={newCouponCode}
                                    onChange={(e) => setNewCouponCode(e.target.value)}
                                    className="uppercase"
                                />
                            </div>
                            <div className="grid gap-2 w-full sm:w-32">
                                <Label>Tipo</Label>
                                <Select value={newCouponType} onValueChange={setNewCouponType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                        <SelectItem value="fixed">Fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2 w-full sm:w-32">
                                <Label htmlFor="coupon-value">Valor</Label>
                                <Input
                                    id="coupon-value"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    placeholder={newCouponType === "percentage" ? "10" : "15.00"}
                                    value={newCouponValue}
                                    onChange={(e) => setNewCouponValue(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => addCouponMutation.mutate()}
                                disabled={addCouponMutation.isPending || !newCouponCode || !newCouponValue}
                                className="w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Adicionar
                            </Button>
                        </div>

                        {loadingCoupons ? (
                            <div className="text-center py-4 text-muted-foreground">Carregando cupons...</div>
                        ) : coupons.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                Nenhum cupom cadastrado.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Desconto</TableHead>
                                            <TableHead className="text-center">Ativo</TableHead>
                                            <TableHead className="text-right">Ação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {coupons.map((coupon: any) => (
                                            <TableRow key={coupon.id}>
                                                <TableCell className="font-medium">{coupon.code}</TableCell>
                                                <TableCell>
                                                    {coupon.discount_type === "percentage"
                                                        ? `${coupon.discount_value}%`
                                                        : `R$ ${coupon.discount_value.toFixed(2).replace(".", ",")}`
                                                    }
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={coupon.is_active}
                                                        onCheckedChange={(checked) => toggleCouponMutation.mutate({ id: coupon.id, is_active: checked })}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (window.confirm("Deseja realmente remover este cupom?")) {
                                                                deleteCouponMutation.mutate(coupon.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
