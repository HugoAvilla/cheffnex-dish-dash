import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const AdminProducts = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<{ ingredient_id: string; quantity_used: number; can_remove: boolean }[]>([]);
  const [productExtras, setProductExtras] = useState<{ id?: string; name: string; price: string; ingredient_id: string; quantity_used: string }[]>([]);
  const [badge, setBadge] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [promoPrice, setPromoPrice] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const { data: categories = [] } = useQuery({
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

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const getCategoryName = (product: any) => {
    if (product.category_id) {
      const cat = categories.find((c: any) => c.id === product.category_id);
      return cat?.name || "—";
    }
    return product.category || "—";
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setCategoryId("");
    setImageFile(null);
    setImagePreview(null);
    setRecipes([]);
    setProductExtras([]);
    setBadge("");
    setIsFeatured(false);
    setPromoPrice("");
  };

  const startEdit = async (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.sell_price));
    setDescription(product.description || "");
    setCategoryId((product as any).category_id || "");
    setImagePreview(product.image_url);
    setImageFile(null);
    setBadge((product as any).badge || "");
    setIsFeatured((product as any).is_featured || false);
    setPromoPrice((product as any).promo_price ? String((product as any).promo_price) : "");

    const { data: recipeData } = await supabase
      .from("recipes")
      .select("ingredient_id, quantity_used, can_remove")
      .eq("product_id", product.id);
    setRecipes(recipeData || []);

    const { data: extrasData } = await supabase
      .from("extras")
      .select("*")
      .eq("product_id", product.id);
    setProductExtras(
      (extrasData || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        price: String(e.price),
        ingredient_id: e.ingredient_id || "",
        quantity_used: String(e.quantity_used),
      }))
    );
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId || !name || !price) throw new Error("Preencha nome e preço");

      let image_url = imagePreview;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const productData: any = {
        name,
        sell_price: Number(price),
        description: description.slice(0, 200),
        category: categoryId ? (categories.find((c: any) => c.id === categoryId)?.name || "Outros") : "Outros",
        category_id: categoryId || null,
        image_url,
      };

      const newColumnsData: any = {
        badge: badge || null,
        is_featured: isFeatured,
        promo_price: promoPrice ? Number(promoPrice) : null,
      };

      let productId = editingId;

      if (editingId && editingId !== "new") {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);
        if (error) throw error;

        // Try to save new columns (may fail if migration not applied)
        try {
          await supabase.from("products").update(newColumnsData).eq("id", editingId);
        } catch { /* migration not yet applied */ }

        await supabase.from("recipes").delete().eq("product_id", editingId);
        await supabase.from("extras").delete().eq("product_id", editingId);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({ ...productData, restaurant_id: restaurantId })
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;

        // Try to save new columns (may fail if migration not applied)
        try {
          await supabase.from("products").update(newColumnsData).eq("id", productId);
        } catch { /* migration not yet applied */ }
      }

      if (recipes.length > 0 && productId) {
        const { error } = await supabase.from("recipes").insert(
          recipes.map((r) => ({ ...r, product_id: productId! }))
        );
        if (error) throw error;
      }

      if (productExtras.length > 0 && productId) {
        const { error } = await supabase.from("extras").insert(
          productExtras.map((e) => ({
            product_id: productId!,
            name: e.name,
            price: Number(e.price) || 0,
            ingredient_id: e.ingredient_id || null,
            quantity_used: Number(e.quantity_used) || 0,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      queryClient.invalidateQueries({ queryKey: ["category-product-counts"] });
      queryClient.invalidateQueries({ queryKey: ["menu-products"] });
      toast.success(editingId === "new" ? "Produto criado!" : "Produto atualizado!");
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("recipes").delete().eq("product_id", id);
      await supabase.from("extras").delete().eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      queryClient.invalidateQueries({ queryKey: ["category-product-counts"] });
      queryClient.invalidateQueries({ queryKey: ["menu-products"] });
      toast.success("Produto removido!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Status atualizado!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addRecipeRow = () => {
    if (ingredients.length === 0) return;
    setRecipes((prev) => [...prev, { ingredient_id: ingredients[0].id, quantity_used: 1, can_remove: false }]);
  };

  const addExtraRow = () => {
    setProductExtras((prev) => [...prev, { name: "", price: "0", ingredient_id: "", quantity_used: "0" }]);
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          {!editingId && (
            <button onClick={() => setEditingId("new")} className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-semibold hover:opacity-90">
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
          )}
        </div>

        {/* Product Table */}
        {!editingId && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum produto cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {products.map((p: any) => (
                  <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{getCategoryName(p)}</TableCell>
                    <TableCell className="text-right font-mono text-foreground">
                      R$ {Number(p.sell_price).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: p.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-muted"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                        <button onClick={() => deleteMutation.mutate(p.id)} className="p-2 rounded-lg hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit/Create Form */}
        {editingId && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editingId === "new" ? "Novo Produto" : "Editar Produto"}</h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Smash Clássico" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Preço (R$)</label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="28.90" type="number" step="0.01" className="font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição (máx. 200 caracteres)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value.slice(0, 200))} placeholder="Descrição breve" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Faixa / Badge</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Nenhuma</option>
                  <option value="NOVIDADE">Novidade</option>
                  <option value="EDIÇÃO LIMITADA">Edição Limitada</option>
                  <option value="PROMOÇÃO">Promoção</option>
                  <option value="MAIS VENDIDO">Mais Vendido</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Preço Promocional (R$)</label>
                <Input value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="Opcional" type="number" step="0.01" className="font-mono" />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <div>
                  <p className="text-sm font-medium text-foreground">Destaque</p>
                  <p className="text-xs text-muted-foreground">Exibir este produto na seção de destaques do cardápio</p>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Foto</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="" className="h-32 rounded-xl object-cover" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-8 w-full text-center text-muted-foreground hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  Clique para enviar imagem
                </button>
              )}
            </div>

            {/* Ficha Técnica */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Ficha Técnica</h3>
                <button type="button" onClick={addRecipeRow} className="flex items-center gap-1.5 text-sm text-accent font-medium hover:opacity-80">
                  <Plus className="h-4 w-4" />
                  Adicionar Insumo
                </button>
              </div>
              {recipes.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum insumo adicionado.</p>}
              <div className="space-y-3">
                {recipes.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted rounded-xl p-3">
                    <select
                      value={r.ingredient_id}
                      onChange={(e) => {
                        const updated = [...recipes];
                        updated[idx] = { ...updated[idx], ingredient_id: e.target.value };
                        setRecipes(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                    </select>
                    <input
                      type="number"
                      value={r.quantity_used}
                      onChange={(e) => {
                        const updated = [...recipes];
                        updated[idx] = { ...updated[idx], quantity_used: Number(e.target.value) };
                        setRecipes(updated);
                      }}
                      className="w-20 px-3 py-2 rounded-lg bg-card border border-border text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Qtd"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-foreground whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={r.can_remove}
                        onChange={(e) => {
                          const updated = [...recipes];
                          updated[idx] = { ...updated[idx], can_remove: e.target.checked };
                          setRecipes(updated);
                        }}
                        className="h-4 w-4 rounded text-accent focus:ring-accent"
                      />
                      Removível
                    </label>
                    <button type="button" onClick={() => setRecipes(recipes.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Adicionais (Extras) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Adicionais (Extras)</h3>
                <button type="button" onClick={addExtraRow} className="flex items-center gap-1.5 text-sm text-accent font-medium hover:opacity-80">
                  <Plus className="h-4 w-4" />
                  Adicionar Extra
                </button>
              </div>
              {productExtras.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum adicional cadastrado.</p>}
              <div className="space-y-3">
                {productExtras.map((extra, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted rounded-xl p-3 flex-wrap">
                    <input
                      value={extra.name}
                      onChange={(e) => {
                        const updated = [...productExtras];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setProductExtras(updated);
                      }}
                      placeholder="Nome do extra"
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={extra.price}
                      onChange={(e) => {
                        const updated = [...productExtras];
                        updated[idx] = { ...updated[idx], price: e.target.value };
                        setProductExtras(updated);
                      }}
                      placeholder="Preço"
                      step="0.01"
                      className="w-24 px-3 py-2 rounded-lg bg-card border border-border text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select
                      value={extra.ingredient_id}
                      onChange={(e) => {
                        const updated = [...productExtras];
                        updated[idx] = { ...updated[idx], ingredient_id: e.target.value };
                        setProductExtras(updated);
                      }}
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sem insumo</option>
                      {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                    </select>
                    <input
                      type="number"
                      value={extra.quantity_used}
                      onChange={(e) => {
                        const updated = [...productExtras];
                        updated[idx] = { ...updated[idx], quantity_used: e.target.value };
                        setProductExtras(updated);
                      }}
                      placeholder="Qtd"
                      className="w-20 px-3 py-2 rounded-lg bg-card border border-border text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="button" onClick={() => setProductExtras(productExtras.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
