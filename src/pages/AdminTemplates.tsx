import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Save, X, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { menuTemplates, type MenuTemplate, type TemplateProduct, type TemplateExtra } from "@/data/menuTemplates";
import { useNavigate } from "react-router-dom";
import { HelpTutorialModal } from "@/components/admin/HelpTutorialModal";
import { useQuery } from "@tanstack/react-query";

interface EditableRecipeItem {
    ingredient_id: string;
    quantity: number;
}

interface EditableExtra extends TemplateExtra {
    ingredient_id?: string;
    quantity_used?: number;
}

interface EditableProduct extends TemplateProduct {
    _removed?: boolean;
    recipe?: EditableRecipeItem[];
    editedExtras?: EditableExtra[];
    imageFile?: File;
    imagePreview?: string;
}

interface SelectedTemplate extends MenuTemplate {
    products: EditableProduct[];
}

const AdminTemplates = () => {
    const { restaurantId } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editableTemplates, setEditableTemplates] = useState<SelectedTemplate[]>([]);
    const [saving, setSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<{ templateId: string; productIndex: number } | null>(null);

    // Step 1: Toggle selection
    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Fetch ingredients for mapping
    const { data: ingredientsData } = useQuery({
        queryKey: ["ingredients", restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const { data, error } = await supabase.from("ingredients").select("*").eq("restaurant_id", restaurantId);
            if (error) throw error;
            return data;
        },
        enabled: !!restaurantId,
    });

    const uploadImage = async (file: File): Promise<string> => {
        const ext = file.name.split(".").pop();
        const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("menu-images").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
        return data.publicUrl;
    };

    // Move to step 2
    const goToStep2 = () => {
        if (selectedIds.size === 0) {
            toast.error("Selecione pelo menos 1 template para continuar.");
            return;
        }
        const selected = menuTemplates
            .filter((t) => selectedIds.has(t.id))
            .map((t) => ({
                ...t,
                products: t.products.map((p) => ({
                    ...p,
                    recipe: [],
                    editedExtras: p.extras ? p.extras.map(e => ({ ...e })) : []
                })),
            }));
        setEditableTemplates(selected);
        setStep(2);
    };

    // Step 2: product editing helpers
    const updateProduct = (templateId: string, index: number, field: keyof EditableProduct, value: any) => {
        setEditableTemplates((prev) =>
            prev.map((t) => {
                if (t.id !== templateId) return t;
                const products = [...t.products];
                products[index] = { ...products[index], [field]: value };
                return { ...t, products };
            })
        );
    };

    const removeProduct = (templateId: string, index: number) => {
        setEditableTemplates((prev) =>
            prev.map((t) => {
                if (t.id !== templateId) return t;
                return { ...t, products: t.products.filter((_, i) => i !== index) };
            })
        );
    };

    const addProduct = (templateId: string) => {
        setEditableTemplates((prev) =>
            prev.map((t) => {
                if (t.id !== templateId) return t;
                return {
                    ...t,
                    products: [
                        ...t.products,
                        { name: "Novo Produto", description: "Descrição do produto", price: 0 },
                    ],
                };
            })
        );
    };

    // Save to Supabase
    const handleSave = async () => {
        if (!restaurantId) {
            toast.error("Restaurante não encontrado.");
            return;
        }
        setSaving(true);
        try {
            // Keep track of created categories for cross-selling mapping: template.id -> db_category_id
            const createdCategories: Record<string, string> = {};

            for (const template of editableTemplates) {
                const validProducts = template.products.filter((p) => p.name.trim());
                if (validProducts.length === 0) continue;

                // Create category
                const { data: catData, error: catError } = await supabase
                    .from("categories")
                    .insert({ name: template.name, restaurant_id: restaurantId, description: template.description })
                    .select("id")
                    .single();
                if (catError) throw catError;

                const categoryId = catData.id;
                createdCategories[template.id] = categoryId;

                // Create products one by one to use their IDs for recipes and extras
                for (const p of validProducts) {
                    let finalImageUrl = null;
                    if (p.imageFile) {
                        finalImageUrl = await uploadImage(p.imageFile);
                    }

                    const { data: prodData, error: prodError } = await supabase
                        .from("products")
                        .insert({
                            name: p.name,
                            description: p.description,
                            sell_price: p.price,
                            image_url: finalImageUrl,
                            category: template.name,
                            category_id: categoryId,
                            restaurant_id: restaurantId,
                            is_active: true,
                        })
                        .select("id")
                        .single();

                    if (prodError) throw prodError;

                    // Insert recipes
                    if (p.recipe && p.recipe.length > 0) {
                        const recipeInserts = p.recipe.map(r => ({
                            product_id: prodData.id,
                            ingredient_id: r.ingredient_id,
                            quantity_used: r.quantity,
                            can_remove: true
                        }));
                        await supabase.from("recipes").insert(recipeInserts);
                    }

                    // Insert extras
                    if (p.editedExtras && p.editedExtras.length > 0) {
                        const extraInserts = p.editedExtras.map(e => ({
                            product_id: prodData.id,
                            name: e.name,
                            price: e.price,
                            ingredient_id: e.ingredient_id || null,
                            is_active: true,
                            quantity_used: e.ingredient_id ? 1 : 0
                        }));
                        await supabase.from("extras").insert(extraInserts);
                    }
                }
            }

            // Post-process cross-selling rules
            const { data: existingCategories } = await supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId);
            for (const template of editableTemplates) {
                if (!template.crossSell || template.crossSell.length === 0) continue;

                const triggerCatId = createdCategories[template.id];
                if (!triggerCatId) continue;

                for (const crossTemplateId of template.crossSell) {
                    const targetTemplate = menuTemplates.find(t => t.id === crossTemplateId);
                    if (!targetTemplate) continue;

                    // Find if the target category exists in the DB (created just now or previously)
                    const suggestCatId = createdCategories[crossTemplateId] || existingCategories?.find(c => c.name === targetTemplate.name)?.id;
                    if (suggestCatId) {
                        // Create cross-sell rule
                        await supabase.from("cross_sell_rules").insert({
                            restaurant_id: restaurantId,
                            trigger_category_id: triggerCatId,
                            suggest_category_id: suggestCatId,
                            step_label: `Vai um(a) ${targetTemplate.name}?`,
                        });
                    }
                }
            }

            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["products-count"] });
            queryClient.invalidateQueries({ queryKey: ["category-product-counts"] });
            queryClient.invalidateQueries({ queryKey: ["menu-products"] });

            toast.success("Templates salvos com sucesso! Seus produtos e categorias foram criados.");
            navigate("/admin/products");
        } catch (err: any) {
            toast.error(err.message || "Erro ao salvar templates.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <HelpTutorialModal
                tutorialKey="admin_templates"
                title="Construtor de Cardápio"
                steps={[
                    { title: "Templates Prontos", description: "Selecione categorias prontas (como Hambúrgueres, Pizzas) para adicionar diversos itens de uma só vez ao seu cardápio." },
                    { title: "Passo 2 - Edição em Lote", description: "Antes de salvar, você pode editar o preço ou remover os itens que não serve. Clicando em cada item, você poderá vincular os Insumos que serão baixados a cada venda." },
                    { title: "Insumos Especiais", description: "Os produtos turbinados, bebidas e complementos serão automaticamente gerados na mesma magia do sistema para impulsionar suas vendas!" },
                ]}
            />
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-amber-500" />
                                Templates Prontos
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {step === 1
                                    ? "Selecione os templates de cardápio que deseja adicionar ao seu restaurante"
                                    : "Revise e edite os produtos antes de salvar"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Step indicator */}
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                            <span className="text-xs">Selecionar</span>
                            <ChevronRight className="h-4 w-4" />
                            <span className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                            <span className="text-xs">Editar & Salvar</span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Template selection */}
                {step === 1 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {menuTemplates.map((template) => {
                                const isSelected = selectedIds.has(template.id);
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => toggleSelection(template.id)}
                                        className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${isSelected
                                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                                            : "border-border bg-card hover:border-primary/30"
                                            }`}
                                    >
                                        {/* Selection indicator */}
                                        <div className={`absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center transition-all ${isSelected
                                            ? "bg-primary text-primary-foreground scale-100"
                                            : "border-2 border-muted-foreground/30 scale-90"
                                            }`}>
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </div>

                                        <div className="text-4xl mb-3">{template.icon}</div>
                                        <h3 className="text-lg font-bold text-foreground">{template.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                                        <p className="text-xs text-muted-foreground mt-3 font-medium">
                                            {template.products.length} produtos inclusos
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Continue button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={goToStep2}
                                disabled={selectedIds.size === 0}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Continuar com {selectedIds.size} template{selectedIds.size !== 1 ? "s" : ""}
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: Edit products */}
                {step === 2 && (
                    <>
                        {editableTemplates.map((template) => (
                            <div key={template.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                {/* Template header */}
                                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{template.icon}</span>
                                        <div>
                                            <h2 className="text-lg font-bold text-foreground">{template.name}</h2>
                                            <p className="text-xs text-muted-foreground">{template.products.length} produtos</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addProduct(template.id)}
                                        className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Adicionar Produto
                                    </button>
                                </div>

                                {/* Products list */}
                                <div className="divide-y divide-border">
                                    {template.products.map((product, idx) => {
                                        const isEditing = editingProduct?.templateId === template.id && editingProduct?.productIndex === idx;

                                        return (
                                            <div
                                                key={idx}
                                                className={`px-6 py-4 transition-colors ${isEditing ? "bg-primary/5" : "hover:bg-muted/20"}`}
                                            >
                                                {isEditing ? (
                                                    /* Editing mode */
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div className="sm:col-span-2">
                                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
                                                                <Input
                                                                    value={product.name}
                                                                    onChange={(e) => updateProduct(template.id, idx, "name", e.target.value)}
                                                                    className="text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço (R$)</label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={product.price}
                                                                    onChange={(e) => updateProduct(template.id, idx, "price", Number(e.target.value))}
                                                                    className="text-sm font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                                                            <Input
                                                                value={product.description}
                                                                onChange={(e) => updateProduct(template.id, idx, "description", e.target.value)}
                                                                className="text-sm"
                                                            />
                                                        </div>

                                                        <div className="pt-3 border-t border-border mt-3">
                                                            <label className="text-xs font-bold text-foreground mb-2 block">Foto do Produto</label>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                id={`file-${template.id}-${idx}`}
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        updateProduct(template.id, idx, "imageFile", file);
                                                                        updateProduct(template.id, idx, "imagePreview", URL.createObjectURL(file));
                                                                    }
                                                                }}
                                                            />
                                                            {product.imagePreview ? (
                                                                <div className="relative inline-block">
                                                                    <img src={product.imagePreview} alt="" className="h-32 w-32 rounded-xl object-cover border border-border" />
                                                                    <button
                                                                        onClick={() => {
                                                                            updateProduct(template.id, idx, "imageFile", undefined);
                                                                            updateProduct(template.id, idx, "imagePreview", undefined);
                                                                        }}
                                                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label
                                                                    htmlFor={`file-${template.id}-${idx}`}
                                                                    className="border-2 border-dashed border-border rounded-xl p-5 w-full flex flex-col items-center justify-center text-center text-muted-foreground hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                                                                >
                                                                    <Upload className="h-5 w-5 mb-2" />
                                                                    <span className="text-xs font-medium">Tirar foto na câmera ou galeria</span>
                                                                </label>
                                                            )}
                                                        </div>

                                                        {/* Recipe Mapping */}
                                                        <div className="pt-3 border-t border-border mt-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <label className="text-xs font-bold text-foreground">Insumos (Receita)</label>
                                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Gerencia o Estoque</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {product.recipe?.map((recipeItem, rIdx) => {
                                                                    const ingredient = ingredientsData?.find(i => i.id === recipeItem.ingredient_id);
                                                                    return (
                                                                        <div key={rIdx} className="flex grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-lg items-center">
                                                                            <span className="flex-1 truncate text-foreground font-medium">{ingredient?.name || 'Insumo não encontrado'}</span>
                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                <Input
                                                                                    type="number"
                                                                                    className="w-20 h-8 text-xs"
                                                                                    value={recipeItem.quantity}
                                                                                    onChange={(e) => {
                                                                                        const newRecipe = [...(product.recipe || [])];
                                                                                        newRecipe[rIdx].quantity = Number(e.target.value);
                                                                                        updateProduct(template.id, idx, "recipe", newRecipe as any);
                                                                                    }}
                                                                                />
                                                                                <span className="text-muted-foreground text-xs w-8">{ingredient?.unit || 'un'}</span>
                                                                                <button onClick={() => {
                                                                                    const newRecipe = product.recipe?.filter((_, i) => i !== rIdx);
                                                                                    updateProduct(template.id, idx, "recipe", newRecipe as any);
                                                                                }} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                                                                                    <X className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                                                                        onChange={(e) => {
                                                                            if (!e.target.value) return;
                                                                            const newRecipe = [...(product.recipe || []), { ingredient_id: e.target.value, quantity: 1 }];
                                                                            updateProduct(template.id, idx, "recipe", newRecipe as any);
                                                                            e.target.value = "";
                                                                        }}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="" disabled>Adicionar insumo à receita...</option>
                                                                        {ingredientsData?.filter(ing => !product.recipe?.some(r => r.ingredient_id === ing.id)).map(ing => (
                                                                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Extras Mapping */}
                                                        {product.editedExtras && product.editedExtras.length > 0 && (
                                                            <div className="pt-3 border-t border-border mt-3">
                                                                <label className="text-xs font-bold text-foreground mb-2 block">Turbinar Produto (Extras Extras)</label>
                                                                <div className="space-y-2">
                                                                    {product.editedExtras?.map((extra, eIdx) => (
                                                                        <div key={eIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-muted/20 rounded-lg items-center border border-border/50">
                                                                            <div className="sm:col-span-5">
                                                                                <Input
                                                                                    value={extra.name}
                                                                                    onChange={(e) => {
                                                                                        const newExtras = [...(product.editedExtras || [])];
                                                                                        newExtras[eIdx].name = e.target.value;
                                                                                        updateProduct(template.id, idx, "editedExtras", newExtras as any);
                                                                                    }}
                                                                                    className="h-8 text-xs"
                                                                                    placeholder="Nome do extra"
                                                                                />
                                                                            </div>
                                                                            <div className="sm:col-span-3">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-xs text-muted-foreground pl-1">R$</span>
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        value={extra.price}
                                                                                        onChange={(e) => {
                                                                                            const newExtras = [...(product.editedExtras || [])];
                                                                                            newExtras[eIdx].price = Number(e.target.value);
                                                                                            updateProduct(template.id, idx, "editedExtras", newExtras as any);
                                                                                        }}
                                                                                        className="h-8 text-xs font-mono"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="sm:col-span-3">
                                                                                <select
                                                                                    className="w-full text-xs bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary h-8"
                                                                                    value={extra.ingredient_id || ""}
                                                                                    onChange={(e) => {
                                                                                        const newExtras = [...(product.editedExtras || [])];
                                                                                        newExtras[eIdx].ingredient_id = e.target.value || undefined;
                                                                                        updateProduct(template.id, idx, "editedExtras", newExtras as any);
                                                                                    }}
                                                                                >
                                                                                    <option value="">Vincular Insumo...</option>
                                                                                    {ingredientsData?.map(ing => (
                                                                                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div className="sm:col-span-1 flex justify-end">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newExtras = product.editedExtras?.filter((_, i) => i !== eIdx);
                                                                                        updateProduct(template.id, idx, "editedExtras", newExtras as any);
                                                                                    }}
                                                                                    className="text-destructive p-1 hover:bg-destructive/10 rounded"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => {
                                                                            const newExtras = [...(product.editedExtras || []), { name: "Novo Extra", price: 0 }];
                                                                            updateProduct(template.id, idx, "editedExtras", newExtras as any);
                                                                        }}
                                                                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1 pt-1"
                                                                    >
                                                                        <Plus className="h-3 w-3" /> Adicionar Extra
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end pt-2">
                                                            <button
                                                                onClick={() => setEditingProduct(null)}
                                                                className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                                Concluir Edição
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* View mode */
                                                    <div className="flex items-center justify-between gap-4">
                                                        {product.imagePreview && (
                                                            <img src={product.imagePreview} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-foreground text-sm truncate">{product.name}</h4>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="font-mono text-sm font-semibold text-foreground">
                                                                R$ {Number(product.price).toFixed(2).replace(".", ",")}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => setEditingProduct({ templateId: template.id, productIndex: idx })}
                                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                                                    title="Editar produto"
                                                                >
                                                                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeProduct(template.id, idx)}
                                                                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                                                    title="Remover produto"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Save button */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 text-muted-foreground font-medium hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Voltar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Salvar Templates
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminTemplates;
