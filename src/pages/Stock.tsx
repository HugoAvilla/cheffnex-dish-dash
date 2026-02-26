import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Package, AlertTriangle, XCircle, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const DEFAULT_CATEGORIES = ["Laticínios", "Proteínas", "Carboidratos", "Verduras/Legumes", "Temperos", "Bebidas", "Embalagens", "Outros"];

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_price: number;
  expiration_date: string | null;
  restaurant_id: string;
  created_at: string;
  category: string;
};

type NewItemForm = {
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  cost_price: number;
  expiration_date: string;
};

const emptyForm: NewItemForm = { name: "", category: "Outros", unit: "UN", min_stock: 0, current_stock: 0, cost_price: 0, expiration_date: "" };

function getStatus(item: Ingredient): "out" | "low" | "normal" {
  if (item.current_stock === 0) return "out";
  if (item.current_stock > 0 && item.current_stock <= item.min_stock * 1.1) return "low";
  return "normal";
}

function StatusBadge({ status }: { status: "out" | "low" | "normal" }) {
  if (status === "out") return <Badge className="bg-destructive text-destructive-foreground">Sem estoque</Badge>;
  if (status === "low") return <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">Estoque baixo</Badge>;
  return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Normal</Badge>;
}

const Stock = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<NewItemForm>(emptyForm);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["ingredients", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return (data as unknown as Ingredient[]) ?? [];
    },
    enabled: !!restaurantId,
  });

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const in7days = addDays(now, 7);
    return {
      total: items.length,
      outOfStock: items.filter(i => i.current_stock === 0).length,
      lowStock: items.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock * 1.1).length,
      nearExpiry: items.filter(i => {
        if (!i.expiration_date) return false;
        const exp = new Date(i.expiration_date);
        return isAfter(exp, now) && isBefore(exp, in7days);
      }).length,
    };
  }, [items]);

  // Filtered + grouped
  const filtered = useMemo(() => {
    return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    for (const item of filtered) {
      const cat = item.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    // Sort categories alphabetically, but "Outros" last
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Outros") return 1;
      if (b === "Outros") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  // All unique categories from items + defaults
  const allCategories = useMemo(() => {
    const fromItems = items.map(i => i.category || "Outros");
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromItems])).sort((a, b) => {
      if (a === "Outros") return 1;
      if (b === "Outros") return -1;
      return a.localeCompare(b);
    });
  }, [items]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error("Sem restaurante");
      const payload: any = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        min_stock: form.min_stock,
        current_stock: form.current_stock,
        cost_price: form.cost_price,
        expiration_date: form.expiration_date || null,
      };
      if (editingItem) {
        const { error } = await supabase.from("ingredients").update(payload).eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ingredients").insert({ ...payload, restaurant_id: restaurantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients-dashboard"] });
      toast.success(editingItem ? "Item atualizado!" : "Item adicionado!");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients-dashboard"] });
      toast.success("Item removido!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const renameCategoryMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!restaurantId) throw new Error("Sem restaurante");
      const { error } = await supabase
        .from("ingredients")
        .update({ category: newName } as any)
        .eq("restaurant_id", restaurantId)
        .eq("category", oldName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast.success("Categoria renomeada!");
      setRenamingCategory(null);
      setNewCategoryName("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category || "Outros",
      unit: item.unit,
      min_stock: item.min_stock,
      current_stock: item.current_stock,
      cost_price: item.cost_price,
      expiration_date: item.expiration_date || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  const categoriesInUse = Array.from(new Set(items.map(i => i.category || "Outros")));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Controle de Estoque</h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
                <p className="text-xs text-muted-foreground">Total de Itens</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{metrics.outOfStock}</p>
                <p className="text-xs text-muted-foreground">Sem Estoque</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{metrics.lowStock}</p>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2.5">
                <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.nearExpiry}</p>
                <p className="text-xs text-muted-foreground">Próx. Vencimento</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="items" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList>
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
            </TabsList>
          </div>

          {/* ITEMS TAB */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar insumo..."
                  className="pl-10"
                />
              </div>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-1" /> Novo Item
              </Button>
            </div>

            {grouped.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum insumo cadastrado.
              </div>
            )}

            {grouped.map(([category, categoryItems]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {category} — {categoryItems.length} {categoryItems.length === 1 ? "item" : "itens"}
                </h3>
                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-center">Estoque Atual</TableHead>
                          <TableHead className="text-center">Estoque Mín.</TableHead>
                          <TableHead className="text-center">Unidade</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryItems.map((item) => {
                          const status = getStatus(item);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-center font-mono">{Number(item.current_stock)}</TableCell>
                              <TableCell className="text-center font-mono">{Number(item.min_stock)}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{item.unit}</TableCell>
                              <TableCell className="text-center">
                                <StatusBadge status={status} />
                              </TableCell>
                              <TableCell>
                                {item.expiration_date
                                  ? format(new Date(item.expiration_date), "dd/MM/yyyy", { locale: ptBR })
                                  : <span className="text-muted-foreground text-xs">Não preenchido</span>
                                }
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">Admin Principal</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            ))}
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gerencie as categorias de estoque. Renomear uma categoria atualiza todos os itens vinculados.
            </p>
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Itens</TableHead>
                      <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCategories.map((cat) => {
                      const count = items.filter(i => (i.category || "Outros") === cat).length;
                      return (
                        <TableRow key={cat}>
                          <TableCell>
                            {renamingCategory === cat ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  className="h-8 w-48"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (newCategoryName.trim()) {
                                      renameCategoryMutation.mutate({ oldName: cat, newName: newCategoryName.trim() });
                                    }
                                  }}
                                  disabled={!newCategoryName.trim() || renameCategoryMutation.isPending}
                                >
                                  Salvar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setRenamingCategory(null); setNewCategoryName(""); }}>
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <span className="font-medium">{cat}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono">{count}</TableCell>
                          <TableCell>
                            {count > 0 && renamingCategory !== cat && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setRenamingCategory(cat); setNewCategoryName(cat); }}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Renomear
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Queijo Mussarela" />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Unidade</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">UN (Unidade)</SelectItem>
                      <SelectItem value="KG">KG (Quilograma)</SelectItem>
                      <SelectItem value="L">L (Litro)</SelectItem>
                      <SelectItem value="G">G (Grama)</SelectItem>
                      <SelectItem value="ML">ML (Mililitro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Custo Unitário (R$)</Label>
                  <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Estoque Mínimo</Label>
                  <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Estoque Atual</Label>
                  <Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Data de Vencimento (opcional)</Label>
                <Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending}>
                {editingItem ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Stock;
