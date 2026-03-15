import { useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdminMenuPreview = () => {
  const { restaurantId } = useAuth();

  const categories = [
    { id: "c1", name: "Pizzas Tradicionais", display_order: 1 },
    { id: "c2", name: "Pizzas Especiais", display_order: 2 },
    { id: "c3", name: "Bebidas", display_order: 3 },
  ];

  const products = [
    { id: "p1", name: "Pizza Margherita", sell_price: 65.90, description: "Mussarela, tomate pelati, manjericão", category_id: "c1", is_active: true, image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=500&fit=crop", badge: "MAIS VENDIDO" },
    { id: "p2", name: "Pizza Calabresa", sell_price: 59.90, description: "Calabresa artesanal, cebola roxa", category_id: "c1", is_active: true, image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop" },
    { id: "p3", name: "Burrata Especial", sell_price: 89.90, description: "Burrata fresca com pesto e azeite trufado", category_id: "c2", is_active: true, image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&h=500&fit=crop", badge: "NOVIDADE", is_featured: true },
    { id: "p4", name: "Coca-Cola 2L", sell_price: 14.00, description: "Gelada", category_id: "c3", is_active: true, image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop" },
    { id: "p5", name: "Suco Natural de Laranja", sell_price: 12.00, description: "500ml", category_id: "c3", is_active: true, image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&h=500&fit=crop" }
  ];
  const isLoading = false;

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    // Group by category_id
    products.forEach((p: any) => {
      const key = p.category_id || "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    // Order by categories display_order
    const result: { category: any; items: any[] }[] = [];
    categories.forEach((cat: any) => {
      const items = map.get(cat.id) || [];
      if (items.length > 0) result.push({ category: cat, items });
    });
    // Uncategorized
    const uncategorized = map.get("uncategorized");
    if (uncategorized?.length) {
      result.push({ category: { id: "uncategorized", name: "Outros", description: null }, items: uncategorized });
    }
    return result;
  }, [categories, products]);

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
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Visualizar Cardápio</h1>
        <p className="text-sm text-muted-foreground">Pré-visualização do cardápio como o cliente verá.</p>

        {grouped.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Nenhum produto ativo para exibir.</p>
        )}

        {grouped.map(({ category, items }) => (
          <div key={category.id}>
            <h2 className="text-xl font-bold text-foreground mb-1">{category.name}</h2>
            {category.description && <p className="text-sm text-muted-foreground mb-3">{category.description}</p>}
            <div className="space-y-3">
              {items.map((product: any) => (
                <div key={product.id} className="flex gap-3 bg-card rounded-xl p-3 border border-border">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                    </div>
                    <p className="text-base font-bold text-accent">
                      R$ {Number(product.sell_price).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminMenuPreview;
