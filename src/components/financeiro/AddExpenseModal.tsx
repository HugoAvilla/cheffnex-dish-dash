import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
  "Aluguel",
  "Água / Energia / Gás",
  "Folha de Pagamento",
  "Fornecedores",
  "Marketing / Publicidade",
  "Manutenção / Equipamentos",
  "Embalagens",
  "Taxas / Impostos",
  "Delivery / Frete",
  "Software / Assinaturas",
  "Outros",
];

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
];

export function AddExpenseModal({ open, onOpenChange, onSuccess }: AddExpenseModalProps) {
  const { restaurantId } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
    setPaymentMethod("");
    setNotes("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = async () => {
    if (!description || !amount || !category || !restaurantId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const amountValue = parseFloat(amount.replace(",", "."));
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("expenses").insert({
        restaurant_id: restaurantId,
        description,
        amount: amountValue,
        category,
        payment_method: paymentMethod || null,
        notes: notes || null,
        expense_date: date,
      });

      if (error) throw error;

      toast.success("Despesa registrada com sucesso!");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Erro ao registrar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ArrowDownRight className="h-5 w-5" />
            Nova Despesa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              placeholder="Ex: Pagamento fornecedor X"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {pm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Detalhes adicionais (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { onOpenChange(false); resetForm(); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Registrar Despesa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
