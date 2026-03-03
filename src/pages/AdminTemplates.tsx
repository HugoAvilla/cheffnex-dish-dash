import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Save, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { menuTemplates, type MenuTemplate, type TemplateProduct } from "@/data/menuTemplates";
import { useNavigate } from "react-router-dom";

interface EditableProduct extends TemplateProduct {
    _removed?: boolean;
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
                products: t.products.map((p) => ({ ...p })),
            }));
        setEditableTemplates(selected);
        setStep(2);
    };

    // Step 2: product editing helpers
    const updateProduct = (templateId: string, index: number, field: keyof TemplateProduct, value: string | number) => {
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

                // Create products
                const productInserts = validProducts.map((p) => ({
                    name: p.name,
                    description: p.description,
                    sell_price: p.price,
                    category: template.name,
                    category_id: categoryId,
                    restaurant_id: restaurantId,
                    is_active: true,
                }));

                const { error: prodError } = await supabase.from("products").insert(productInserts);
                if (prodError) throw prodError;
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
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => setEditingProduct(null)}
                                                                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                                Concluir
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* View mode */
                                                    <div className="flex items-center justify-between gap-4">
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
