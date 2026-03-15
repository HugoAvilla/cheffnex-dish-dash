import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, GripVertical, Volume2, VolumeX, CheckCircle2, FileText, MapPin, Receipt, Clock } from "lucide-react";
import { toast } from "sonner";
import { HelpTutorialModal } from "@/components/admin/HelpTutorialModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderWithItems {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  order_type: string;
  delivery_address: string | null;
  payment_method: string;
  change_for?: number;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    extras_json: any;
    products: { name: string } | null;
  }[];
}

const statusColumns = [
  { key: "NEW", label: "Novos Pedidos", color: "border-accent" },
  { key: "PREPARING", label: "Em Preparo", color: "border-warning" },
  { key: "DISPATCHED", label: "Saiu p/ Entrega", color: "border-primary" },
  { key: "COMPLETED", label: "Concluído", color: "border-success" },
];

const AdminOrders = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedOrders, setDismissedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const prevOrderCount = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const orders = [
    {
      id: "o1", customer_name: "João Silva", customer_phone: "11999999999", total_amount: 145.80, status: "NEW", order_type: "DELIVERY", delivery_address: "Rua das Flores, 123 - Centro", payment_method: "PIX", created_at: new Date().toISOString(),
      order_items: [
        { id: "i1", quantity: 2, unit_price: 65.90, notes: "Sem cebola por favor", extras_json: [{ name: "Borda Recheada Catupiry", qty: 1, price: 14.00 }], products: { name: "Pizza Margherita" } }
      ]
    },
    {
      id: "o2", customer_name: "Maria Santos", customer_phone: "11988888888", total_amount: 89.90, status: "PREPARING", order_type: "LOCAL", delivery_address: null, payment_method: "CARD", created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      order_items: [
        { id: "i2", quantity: 1, unit_price: 89.90, notes: null, extras_json: [], products: { name: "Burrata Especial" } }
      ]
    },
    {
      id: "o3", customer_name: "Carlos Almeida", customer_phone: "11977777777", total_amount: 73.90, status: "DISPATCHED", order_type: "DELIVERY", delivery_address: "Av Paulista, 1000 - Apto 42", payment_method: "CASH", change_for: 100, created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      order_items: [
        { id: "i3", quantity: 1, unit_price: 59.90, notes: "Bem assada", extras_json: [], products: { name: "Pizza Calabresa" } },
        { id: "i4", quantity: 1, unit_price: 14.00, notes: null, extras_json: [], products: { name: "Coca-Cola 2L" } }
      ]
    },
    {
      id: "o4", customer_name: "Ana Costa", customer_phone: "11966666666", total_amount: 65.90, status: "COMPLETED", order_type: "PICKUP", delivery_address: null, payment_method: "PIX", created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      order_items: [
        { id: "i5", quantity: 1, unit_price: 65.90, notes: null, extras_json: [], products: { name: "Pizza Margherita" } }
      ]
    }
  ] as any[];

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch { }
  };

  // Real-time subscription
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          playNotificationSound();
          toast.info("🔔 Novo pedido recebido!");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, queryClient, soundEnabled]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const moveOrder = (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;
    if (newStatus === "DISPATCHED") {
      toast.success("Pedido saiu para entrega!");
    } else if (newStatus === "COMPLETED") {
      toast.success("Pedido concluído!");
    }
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  const handleWhatsApp = (order: OrderWithItems, msgType: "dispatched" | "completed") => {
    const msg = msgType === "dispatched"
      ? `Ola ${order.customer_name}! Seu pedido saiu para entrega!`
      : `Ola ${order.customer_name}! Seu pedido esta pronto!`;
    const phone = order.customer_phone?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const getOrderNumber = (order: OrderWithItems) => {
    const date = new Date(order.created_at);
    return `${date.getHours().toString().padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}${date.getSeconds().toString().padStart(2, "0")}`;
  };

  const getOrderTypeLabel = (type: string) => {
    if (type === "DELIVERY") return "Delivery";
    if (type === "LOCAL") return "Local";
    return "Retirada";
  };

  return (
    <AdminLayout>
      <HelpTutorialModal
        tutorialKey="admin_orders"
        title="Gestão de Pedidos"
        steps={[
          { title: "Controle de Pedidos", description: "Esta tela mostra o fluxo completo dos pedidos do seu restaurante em formato Kanban." },
          { title: "Mover Pedidos", description: "Clique e arraste os cartões, ou clique neles para visualizar os detalhes. Você também pode alterá-los de status para 'Em Preparo', 'Saiu p/ Entrega' ou 'Concluído'." },
          { title: "Detalhes e Impressão", description: "Ao clicar num pedido, você será capaz de visualizar exatamente o que o cliente pediu (com as observações e extras), além de poder mandar mensagens pelo WhatsApp." },
          { title: "Notificações", description: "Seu sistema fará um som sempre que um novo pedido chegar, não se esqueça de ativar as notificações ou clicar no botão de som para testar." },
        ]}
      />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Gestão de Pedidos</h1>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${soundEnabled ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? "Som On" : "Som Off"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {statusColumns.map((col) => (
            <div
              key={col.key}
              className={`bg-muted/50 rounded-xl border-t-4 ${col.color} min-h-[400px]`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedOrder) moveOrder(draggedOrder, col.key);
                setDraggedOrder(null);
              }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground text-sm">{col.label}</h2>
                  <span className="text-xs bg-card border border-border px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                    {orders
                      .filter((o) => o.status === col.key && !dismissedOrders.has(o.id)).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {orders
                    .filter((o) => o.status === col.key && !dismissedOrders.has(o.id))
                    .map((order) => (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDraggedOrder(order.id);
                        }}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-card rounded-xl border border-border p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold text-foreground text-sm">#{getOrderNumber(order)}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.order_type === "DELIVERY" ? "bg-primary/10 text-primary"
                            : order.order_type === "LOCAL" ? "bg-warning/10 text-warning"
                              : "bg-accent/10 text-accent"
                            }`}>
                            {getOrderTypeLabel(order.order_type)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-medium">{order.customer_name}</p>
                        {order.delivery_address && (
                          <p className="text-xs text-muted-foreground mt-1">📍 {order.delivery_address}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="text-xs text-muted-foreground">
                              • {item.quantity}x {item.products?.name || "Produto"}
                              {item.notes && (
                                <span className="text-destructive font-medium"> ({item.notes})</span>
                              )}
                              {item.extras_json && Array.isArray(item.extras_json) && item.extras_json.length > 0 && (
                                <span className="text-accent font-medium"> (+{(item.extras_json as any[]).map((e: any) => `${e.qty}x ${e.name}`).join(", ")})</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                          <span className="font-bold text-foreground font-mono text-sm">
                            R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}
                          </span>
                          {col.key === "DISPATCHED" && (
                            <button
                              onClick={() => handleWhatsApp(order, "dispatched")}
                              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Avisar
                            </button>
                          )}
                          {col.key === "COMPLETED" && (
                            <button
                              onClick={() => {
                                // Immediately remove from UI
                                setDismissedOrders(prev => new Set(prev).add(order.id));
                                // Try to delete from DB in background
                                supabase.from("order_items").delete().eq("order_id", order.id)
                                  .then(() => supabase.from("orders").delete().eq("id", order.id))
                                  .then(() => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }));
                                toast.success("Pedido finalizado!");
                              }}
                              className="flex items-center gap-1.5 text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Finalizado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Pedido #{selectedOrder ? getOrderNumber(selectedOrder) : ""}</DialogTitle>
              {selectedOrder && (
                <Badge variant="outline" className={`
                  ${selectedOrder.order_type === "DELIVERY" ? "bg-primary/10 text-primary border-primary/20" :
                    selectedOrder.order_type === "LOCAL" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-accent/10 text-accent border-accent/20"}
                `}>
                  {getOrderTypeLabel(selectedOrder.order_type)}
                </Badge>
              )}
            </div>
            {selectedOrder && (
              <DialogDescription className="text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" />
                Criado às {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
              {/* Customer Info */}
              <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-primary">{selectedOrder.customer_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{selectedOrder.customer_name}</h3>
                    {selectedOrder.customer_phone && <p className="text-sm text-foreground">{selectedOrder.customer_phone}</p>}
                  </div>
                </div>
                {selectedOrder.delivery_address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-primary" />
                  Itens do Pedido
                </h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, i) => (
                    <div key={item.id || i} className="bg-card p-3 rounded-xl border border-border">
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-sm">
                          <span className="text-primary font-bold mr-2">{item.quantity}x</span>
                          {item.products?.name || "Produto sem nome"}
                        </div>
                        <span className="text-sm font-semibold">
                          R$ {(item.quantity * item.unit_price).toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {item.notes && (
                        <div className="mt-2 text-sm text-destructive bg-destructive/5 p-2 rounded-lg flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">Obs: {item.notes}</span>
                        </div>
                      )}

                      {item.extras_json && Array.isArray(item.extras_json) && item.extras_json.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-accent/30 space-y-1">
                          {(item.extras_json as any[]).map((extra: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                + {extra.qty}x {extra.name}
                              </span>
                              <span className="text-accent font-medium">
                                R$ {(extra.qty * extra.price).toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>Método de Pagamento</span>
                  <span>{selectedOrder.payment_method}</span>
                </div>
                {selectedOrder.change_for && (
                  <div className="flex items-center justify-between text-sm text-warning mb-2">
                    <span>Troco para</span>
                    <span>R$ {selectedOrder.change_for.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-bold text-lg mt-2">
                  <span>Total</span>
                  <span className="text-primary">R$ {Number(selectedOrder.total_amount).toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
