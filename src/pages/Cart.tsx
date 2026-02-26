import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Minus, Plus, Trash2, Truck, Store, MapPin, MessageCircle, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Cart = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "local" | null>(null);
  const [payment, setPayment] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", cep: "", address: "", number: "", table: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async () => {
    if (items.length === 0 || !orderType || !payment || !form.name) return;
    setSubmitting(true);

    try {
      const { data: productData } = await supabase
        .from("products")
        .select("restaurant_id")
        .eq("id", items[0].product.id)
        .single();

      const restaurantId = productData?.restaurant_id;
      if (!restaurantId) throw new Error("Restaurante não encontrado");

      const orderTypeMap = { delivery: "DELIVERY", pickup: "PICKUP", local: "LOCAL" };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          customer_name: form.name,
          customer_phone: form.phone || null,
          order_type: orderTypeMap[orderType],
          delivery_address: orderType === "delivery" ? `${form.address}, ${form.number} - CEP ${form.cep}` : orderType === "local" ? `Mesa ${form.table}` : null,
          payment_method: payment === "Dinheiro" ? "CASH" : payment === "PIX" ? "PIX" : "CARD",
          change_for: payment === "Dinheiro" && changeFor ? Number(changeFor) : null,
          total_amount: total,
          status: "NEW",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        notes: item.removed.length > 0 ? item.removed.map((r) => `Sem ${r}`).join(", ") : null,
        extras_json: item.extras.length > 0
          ? item.extras.map((e) => ({ extra_id: e.extra_id, name: e.name, price: e.price, qty: e.qty }))
          : [],
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Build WhatsApp message
      let msg = `🍔 *Novo Pedido CheffNex*\n\n`;
      items.forEach((item) => {
        msg += `• ${item.quantity}x ${item.product.name}`;
        if (item.removed.length) msg += ` (Sem: ${item.removed.join(", ")})`;
        if (item.extras.length) msg += ` (+${item.extras.map((e) => `${e.qty}x ${e.name}`).join(", ")})`;
        msg += "\n";
      });
      msg += `\n💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*`;
      msg += `\n📦 ${orderType === "delivery" ? "Delivery" : orderType === "local" ? `Local - Mesa ${form.table}` : "Retirada"}`;
      if (orderType === "delivery") msg += `\n📍 ${form.address}, ${form.number} - CEP ${form.cep}`;
      msg += `\n👤 ${form.name} - ${form.phone}`;
      msg += `\n💳 ${payment}`;
      if (payment === "Dinheiro" && changeFor) msg += ` (Troco para R$ ${changeFor})`;

      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
      clearCart();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground text-lg mb-4">Seu carrinho está vazio</p>
        <button onClick={() => navigate("/")} className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold">
          Ver Cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-44">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Meu Carrinho</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-card rounded-xl border border-border p-3 flex gap-3">
            {item.product.image && <img src={item.product.image} className="h-16 w-16 rounded-lg object-cover" alt="" />}
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-semibold text-foreground text-sm">{item.product.name}</h3>
                <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {item.removed.length > 0 && <p className="text-xs text-destructive">Sem: {item.removed.join(", ")}</p>}
              {item.extras.length > 0 && <p className="text-xs text-muted-foreground">+{item.extras.map((e) => `${e.qty}x ${e.name}`).join(", ")}</p>}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center bg-card">
                    <Minus className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="font-bold text-accent text-sm">
                  R$ {((item.product.price + item.extras.reduce((s, e) => s + e.price * e.qty, 0)) * item.quantity).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div>
          <h3 className="font-semibold text-foreground mb-2">Tipo de Pedido</h3>
          <div className="grid grid-cols-3 gap-3">
            {([["delivery", "Delivery", Truck], ["pickup", "Retirar", Store], ["local", "Local", MapPin]] as const).map(([type, label, Icon]) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 font-medium transition-colors ${
                  orderType === type ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {orderType && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
            {orderType === "delivery" && (
              <>
                <input placeholder="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
                <input placeholder="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
                <input placeholder="Número" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
              </>
            )}
            {orderType === "local" && (
              <input placeholder="Número da Mesa" value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
            )}
            <input placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
            <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
          </motion.div>
        )}

        {orderType && (
          <div>
            <h3 className="font-semibold text-foreground mb-2">Pagamento</h3>
            <div className="space-y-2">
              {["Dinheiro", "Cartão", "PIX"].map((p) => (
                <label key={p} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 cursor-pointer">
                  <input type="radio" name="payment" checked={payment === p} onChange={() => setPayment(p)} className="h-4 w-4 text-accent focus:ring-accent" />
                  <span className="text-sm font-medium text-foreground">{p}</span>
                </label>
              ))}
            </div>
            {payment === "Dinheiro" && (
              <input placeholder="Troco para quanto?" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none" />
            )}
          </div>
        )}
      </div>

      {/* Finalize button above tab bar */}
      <div className="fixed bottom-[57px] left-0 right-0 p-4 bg-card border-t border-border z-40">
        <button
          onClick={handleFinish}
          disabled={!orderType || !payment || !form.name || !form.phone || submitting}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-accent text-accent-foreground py-4 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageCircle className="h-5 w-5" />
          {submitting ? "Enviando..." : `Finalizar Pedido via WhatsApp — R$ ${total.toFixed(2).replace(".", ",")}`}
        </button>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex">
          <button onClick={() => navigate("/")} className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground">
            <UtensilsCrossed className="h-5 w-5" />
            <span className="text-xs font-medium">Cardápio</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-1 py-3 text-accent relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs font-semibold">Carrinho</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Cart;
