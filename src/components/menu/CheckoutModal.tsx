import { useState } from "react";
import { X, ChevronLeft, MessageCircle, MapPin, Store, CreditCard, Banknote, QrCode, Ticket } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string | null;
  restaurantPhone?: string | null;
  primaryColor?: string;
}

export const CheckoutModal = ({ open, onClose, restaurantId, restaurantPhone, primaryColor }: CheckoutModalProps) => {
  const { items, total, clearCart } = useCart();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState({ cep: "", street: "", neighborhood: "", city: "", number: "", complement: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const accentColor = primaryColor || "hsl(var(--accent))";
  const steps = ["Resumo & Entrega", "Pagamento", "Identificação"];

  const calculatedTotal = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? total * (1 - appliedCoupon.value / 100)
      : Math.max(0, total - appliedCoupon.value)
    : total;

  const handleApplyCoupon = async () => {
    if (!couponCode || !restaurantId) return;
    setCheckingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Cupom inválido ou expirado.");
        setAppliedCoupon(null);
      } else {
        toast.success("Cupom aplicado com sucesso!");
        setAppliedCoupon({
          code: data.code,
          type: data.discount_type,
          value: data.discount_value
        });
      }
    } catch {
      toast.error("Erro ao validar cupom.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return true;
    if (step === 1) return !!paymentMethod;
    if (step === 2) return !!name && !!phone;
    return false;
  };

  const handleSubmit = async () => {
    if (!restaurantId || items.length === 0) return;
    setSubmitting(true);

    try {
      const deliveryAddr = orderType === "delivery"
        ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}, ${address.neighborhood} - ${address.city} - CEP ${address.cep}`
        : null;

      // Build WhatsApp message
      let msg = `*Novo Pedido*\n\n`;
      items.forEach((item) => {
        msg += `- ${item.quantity}x ${item.product.name}`;
        if (item.removed.length) msg += ` (Sem: ${item.removed.join(", ")})`;
        if (item.extras.length) msg += ` (+${item.extras.map((e) => `${e.qty}x ${e.name}`).join(", ")})`;
        msg += "\n";
      });

      msg += `\n*Subtotal: R$ ${total.toFixed(2).replace(".", ",")}*`;
      if (appliedCoupon) {
        const discountAmount = total - calculatedTotal;
        msg += `\n*Desconto (${appliedCoupon.code}): -R$ ${discountAmount.toFixed(2).replace(".", ",")}*`;
      }
      msg += `\n*Total a Pagar: R$ ${calculatedTotal.toFixed(2).replace(".", ",")}*`;
      msg += `\nTipo: ${orderType === "delivery" ? "Delivery" : "Retirada"}`;
      if (orderType === "delivery") msg += `\nEndereco: ${deliveryAddr}`;
      msg += `\nCliente: ${name} - ${phone}`;
      msg += `\nPagamento: ${paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartao" : "Dinheiro"}`;
      if (paymentMethod === "cash" && changeFor) msg += ` (Troco para R$ ${changeFor})`;

      const encoded = encodeURIComponent(msg);
      const whatsappPhone = restaurantPhone?.replace(/\D/g, "") || "";
      window.open(`https://wa.me/${whatsappPhone}?text=${encoded}`, "_blank");

      clearCart();
      onClose();
      toast.success("Pedido enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-50 bg-card max-h-[90vh] overflow-y-auto ${isMobile
              ? "bottom-0 left-0 right-0 rounded-t-2xl"
              : "top-1/2 left-1/2 max-w-lg w-full rounded-2xl max-h-[85vh]"
              }`}
            style={!isMobile ? { x: "-50%", y: "-50%" } : undefined}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="p-1 rounded-full hover:bg-muted">
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                )}
                <h2 className="text-lg font-bold text-foreground">Finalizar Pedido</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1 px-4 pt-4">
              {steps.map((s, i) => (
                <div key={i} className="flex-1 flex items-center gap-1">
                  <div
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{ backgroundColor: i <= step ? accentColor : "hsl(var(--muted))" }}
                  />
                </div>
              ))}
            </div>
            <p className="px-4 pt-1 text-xs text-muted-foreground">Passo {step + 1} de {steps.length} — {steps[step]}</p>

            <div className="p-4 space-y-4">
              {/* Step 0: Delivery */}
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Como deseja receber?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType("pickup")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${orderType === "pickup" ? "border-current" : "border-border"
                        }`}
                      style={{ color: orderType === "pickup" ? accentColor : undefined }}
                    >
                      <Store className="h-6 w-6" />
                      <span className="text-sm font-medium">Retirar</span>
                    </button>
                    <button
                      onClick={() => setOrderType("delivery")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${orderType === "delivery" ? "border-current" : "border-border"
                        }`}
                      style={{ color: orderType === "delivery" ? accentColor : undefined }}
                    >
                      <MapPin className="h-6 w-6" />
                      <span className="text-sm font-medium">Receber em casa</span>
                    </button>
                  </div>

                  {orderType === "delivery" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                      <input value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} placeholder="CEP" className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                      <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Rua" className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                      <input value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} placeholder="Bairro" className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                      <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Cidade" className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                      <div className="flex gap-3">
                        <input value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} placeholder="Número" className="w-1/3 px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                        <input value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} placeholder="Complemento" className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t border-border mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-primary" />
                      Cupom de Desconto
                    </h3>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Possui um cupom?"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={checkingCoupon || !couponCode}
                        className="px-4 py-2.5 rounded-xl bg-muted text-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {checkingCoupon ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="mt-2 text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-2 rounded-lg flex items-center justify-between">
                        <span>Cupom {appliedCoupon.code} aplicado!</span>
                        <span>- R$ {(total - calculatedTotal).toFixed(2).replace(".", ",")}</span>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Step 1: Payment */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Forma de pagamento</h3>
                  <div className="space-y-2">
                    {[
                      { key: "pix", label: "PIX", icon: QrCode },
                      { key: "card", label: "Cartão na Entrega", icon: CreditCard },
                      { key: "cash", label: "Dinheiro", icon: Banknote },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setPaymentMethod(key)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${paymentMethod === key ? "border-current" : "border-border"
                          }`}
                        style={{ color: paymentMethod === key ? accentColor : undefined }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === "cash" && (
                    <input
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Troco para quanto? (R$)"
                      className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
                    />
                  )}
                </div>
              )}

              {/* Step 2: Identification */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Seus dados</h3>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp (ex: 11999999999)" className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              {step < 2 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canAdvance()}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canAdvance() || submitting}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <MessageCircle className="h-5 w-5" />
                  {submitting ? "Enviando..." : `Enviar Pedido — R$ ${calculatedTotal.toFixed(2).replace(".", ",")}`}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )
      }
    </AnimatePresence >
  );
};
