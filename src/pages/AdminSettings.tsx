import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";

const AdminSettings = () => {
    const { restaurantId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expiryAlertDays, setExpiryAlertDays] = useState(1);
    const [lowStockThreshold, setLowStockThreshold] = useState(10);

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
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
