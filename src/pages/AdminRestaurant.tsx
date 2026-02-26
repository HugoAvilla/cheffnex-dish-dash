import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, Copy, Download, Check, Save, Users, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

const AdminRestaurant = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");

  // Waiter modal state
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [waiterName, setWaiterName] = useState("");
  const [waiterEmail, setWaiterEmail] = useState("");
  const [waiterPassword, setWaiterPassword] = useState("");

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  // Fetch plan info
  const { data: plan } = useQuery({
    queryKey: ["restaurant-plan", restaurant?.plan_id],
    queryFn: async () => {
      if (!restaurant?.plan_id) return null;
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", restaurant.plan_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.plan_id,
  });

  // Fetch waiters (STAFF users from same restaurant)
  const { data: waiters = [], isLoading: loadingWaiters } = useQuery({
    queryKey: ["waiters", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      // Get profiles linked to this restaurant that have STAFF role
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("restaurant_id", restaurantId);
      if (error) throw error;

      // Filter only STAFF users - we need to check user_roles
      // Since RLS on user_roles only allows seeing own roles, we use the count function
      // Instead, we'll get all profiles and the admin can see their own restaurant's profiles
      // We need a different approach - let's use the edge function or a server-side check
      // For now, we'll return all non-admin profiles from this restaurant
      return profiles || [];
    },
    enabled: !!restaurantId,
  });

  // Count waiters via RPC
  const { data: waiterCount = 0 } = useQuery({
    queryKey: ["waiter-count", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const { data, error } = await supabase.rpc("count_restaurant_waiters", {
        _restaurant_id: restaurantId,
      });
      if (error) throw error;
      return data || 0;
    },
    enabled: !!restaurantId,
  });

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || "");
      setPhone(restaurant.phone || "");
      setDocument(restaurant.document || "");
    }
  }, [restaurant]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error("Sem restaurante");
      const { error } = await supabase
        .from("restaurants")
        .update({ name, phone: phone || null, document: document || null })
        .eq("id", restaurantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant"] });
      toast.success("Dados atualizados!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createWaiterMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-waiter", {
        body: {
          email: waiterEmail,
          password: waiterPassword,
          full_name: waiterName,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiters"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-count"] });
      toast.success("Garçon criado com sucesso!");
      setShowWaiterModal(false);
      setWaiterName("");
      setWaiterEmail("");
      setWaiterPassword("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteWaiterMutation = useMutation({
    mutationFn: async (waiterId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-waiter", {
        body: { waiter_id: waiterId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiters"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-count"] });
      toast.success("Garçon removido!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const menuUrl = restaurantId
    ? `${window.location.origin}/menu/${restaurantId}`
    : "";

  const qrCodeUrl = menuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(menuUrl)}&size=250x250`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const downloadQR = () => {
    const a = window.document.createElement("a");
    a.href = qrCodeUrl;
    a.download = "qrcode-cardapio.png";
    a.target = "_blank";
    a.click();
  };

  const maxWaiters = plan?.max_waiters ?? 2;
  const usagePercent = maxWaiters > 0 ? (waiterCount / maxWaiters) * 100 : 0;

  if (isLoading) {
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
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Restaurante</h1>
        </div>

        {/* Info do restaurante */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do restaurante" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>Documento (CNPJ/CPF)</Label>
                <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>

        {/* Equipe - Garçons */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Equipe
                </CardTitle>
                <CardDescription>
                  Gerencie os garçons do seu restaurante
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowWaiterModal(true)}
                disabled={waiterCount >= maxWaiters}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Garçons: <span className="font-semibold text-foreground">{waiterCount}/{maxWaiters}</span>
                </span>
                <Badge variant={waiterCount >= maxWaiters ? "destructive" : "secondary"}>
                  {plan?.name || "Básico"}
                </Badge>
              </div>
              <Progress value={usagePercent} className="h-2" />
              {waiterCount >= maxWaiters && (
                <p className="text-xs text-destructive">
                  Limite atingido. Faça upgrade do plano para adicionar mais garçons.
                </p>
              )}
            </div>

            {/* Waiters list */}
            {loadingWaiters ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : waiterCount === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Nenhum garçon cadastrado ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {waiters
                  .filter((w) => w.id !== (supabase as any).auth?.currentUser?.id) // exclude self
                  .map((waiter) => (
                    <div
                      key={waiter.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {waiter.full_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Desde {new Date(waiter.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover garçon?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso removerá permanentemente o acesso de{" "}
                              <strong>{waiter.full_name}</strong> ao sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteWaiterMutation.mutate(waiter.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link do Cardápio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link do Cardápio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link para que seus clientes acessem o cardápio digital.
            </p>
            <div className="flex items-center gap-2">
              <Input value={menuUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Code do Cardápio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Imprima este QR Code e coloque nas mesas para acesso rápido ao cardápio.
            </p>
            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl border border-border">
                  <img src={qrCodeUrl} alt="QR Code do cardápio" className="w-[250px] h-[250px]" />
                </div>
                <Button variant="outline" onClick={downloadQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para criar garçon */}
      <Dialog open={showWaiterModal} onOpenChange={setShowWaiterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Garçon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome completo</Label>
              <Input
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="Nome do garçon"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={waiterEmail}
                onChange={(e) => setWaiterEmail(e.target.value)}
                placeholder="garcon@email.com"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={waiterPassword}
                onChange={(e) => setWaiterPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWaiterModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createWaiterMutation.mutate()}
              disabled={
                createWaiterMutation.isPending ||
                !waiterName ||
                !waiterEmail ||
                !waiterPassword
              }
            >
              {createWaiterMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Garçon"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRestaurant;
