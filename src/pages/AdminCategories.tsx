import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, X, GripVertical, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const AdminCategories = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [showCrossSell, setShowCrossSell] = useState(false);

  // Cross-sell form
  const [csTriggerId, setCsTriggerId] = useState("");
  const [csSuggestId, setCsSuggestId] = useState("");
  const [csLabel, setCsLabel] = useState("Acompanhamentos");
  const [csOrder, setCsOrder] = useState("0");
  const [csEditingId, setCsEditingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const { data: productCounts = {} } = useQuery({
    queryKey: ["category-product-counts", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return {};
      const { data, error } = await supabase
        .from("products")
        .select("category_id")
        .eq("restaurant_id", restaurantId);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((p: any) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: !!restaurantId,
  });

  const { data: crossSellRules = [] } = useQuery({
    queryKey: ["cross-sell-rules-admin", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("cross_sell_rules")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!restaurantId,
  });

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setDisplayOrder("0");
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setDisplayOrder(String(cat.display_order));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId || !name.trim()) throw new Error("Nome é obrigatório");
      if (editingId && editingId !== "new") {
        const { error } = await supabase
          .from("categories")
          .update({ name: name.trim(), description: description.trim() || null, display_order: Number(displayOrder) })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ name: name.trim(), description: description.trim() || null, display_order: Number(displayOrder), restaurant_id: restaurantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(editingId === "new" ? "Categoria criada!" : "Categoria atualizada!");
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Cross-sell mutations
  const saveCrossSell = useMutation({
    mutationFn: async () => {
      if (!restaurantId || !csTriggerId || !csSuggestId) throw new Error("Selecione as categorias");
      if (csEditingId) {
        const { error } = await supabase.from("cross_sell_rules").update({
          trigger_category_id: csTriggerId,
          suggest_category_id: csSuggestId,
          step_label: csLabel,
          display_order: Number(csOrder),
        }).eq("id", csEditingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cross_sell_rules").insert({
          restaurant_id: restaurantId,
          trigger_category_id: csTriggerId,
          suggest_category_id: csSuggestId,
          step_label: csLabel,
          display_order: Number(csOrder),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cross-sell-rules-admin"] });
      toast.success("Regra de sugestão salva!");
      setCsTriggerId("");
      setCsSuggestId("");
      setCsLabel("Acompanhamentos");
      setCsOrder("0");
      setCsEditingId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCrossSell = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cross_sell_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cross-sell-rules-admin"] });
      toast.success("Regra removida!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getCatName = (id: string) => categories.find((c: any) => c.id === id)?.name || "—";

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
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCrossSell(!showCrossSell)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${showCrossSell ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
            >
              <Link2 className="h-4 w-4" />
              Cross-sell
            </button>
            {!editingId && !showCrossSell && (
              <button onClick={() => setEditingId("new")} className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-semibold hover:opacity-90">
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            )}
          </div>
        </div>

        {/* Category Form */}
        {editingId && !showCrossSell && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editingId === "new" ? "Nova Categoria" : "Editar Categoria"}</h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Entradas" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Ordem de exibição</label>
                <Input value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição (opcional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição curta da categoria" />
            </div>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Categoria"}
            </button>
          </div>
        )}

        {/* Cross-sell Config */}
        {showCrossSell && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Regras de Sugestão (Cross-sell)</h2>
              <p className="text-sm text-muted-foreground">Quando o cliente pede da categoria A, sugerir itens da categoria B.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Quando pedir de *</label>
                  <select value={csTriggerId} onChange={(e) => setCsTriggerId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Selecione categoria</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Sugerir *</label>
                  <select value={csSuggestId} onChange={(e) => setCsSuggestId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Selecione categoria</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Título da etapa</label>
                  <Input value={csLabel} onChange={(e) => setCsLabel(e.target.value)} placeholder="Ex: Acompanhamentos" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Ordem</label>
                  <Input value={csOrder} onChange={(e) => setCsOrder(e.target.value)} type="number" placeholder="0" />
                </div>
              </div>
              <button onClick={() => saveCrossSell.mutate()} disabled={saveCrossSell.isPending} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50">
                {saveCrossSell.isPending ? "Salvando..." : csEditingId ? "Atualizar Regra" : "Adicionar Regra"}
              </button>
            </div>

            {/* Existing rules */}
            <div className="space-y-2">
              {crossSellRules.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma regra de cross-sell configurada.</p>}
              {crossSellRules.map((rule: any) => (
                <div key={rule.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-accent">{getCatName(rule.trigger_category_id)}</span>
                      {" → "}
                      <span className="text-primary">{getCatName(rule.suggest_category_id)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">"{rule.step_label}" • Ordem: {rule.display_order}</p>
                  </div>
                  <button onClick={() => deleteCrossSell.mutate(rule.id)} className="p-2 rounded-lg hover:bg-muted">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category List */}
        {!editingId && !showCrossSell && (
          <div className="space-y-2">
            {categories.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhuma categoria cadastrada.</p>}
            {categories.map((cat: any) => (
              <div key={cat.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {productCounts[cat.id] || 0} {(productCounts[cat.id] || 0) === 1 ? "item" : "itens"}
                    </span>
                  </div>
                  {cat.description && <p className="text-sm text-muted-foreground mt-0.5">{cat.description}</p>}
                  <p className="text-xs text-muted-foreground/70">Ordem: {cat.display_order}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(cat)} className="p-2 rounded-lg hover:bg-muted"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => deleteMutation.mutate(cat.id)} className="p-2 rounded-lg hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
