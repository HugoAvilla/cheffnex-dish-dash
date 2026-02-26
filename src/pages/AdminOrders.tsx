import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, GripVertical, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface OrderWithItems {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  order_type: string;
  delivery_address: string | null;
  payment_method: string;
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
  const prevOrderCount = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as OrderWithItems[];
    },
    enabled: !!restaurantId,
  });

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
                        onDragStart={() => setDraggedOrder(order.id)}
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
    </AdminLayout>
  );
};

export default AdminOrders;
