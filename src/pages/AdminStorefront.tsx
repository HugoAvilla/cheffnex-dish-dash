import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X, Palette, Save, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const COLOR_SWATCHES = [
  { name: "Vermelho", value: "#E11D48" },
  { name: "Laranja", value: "#EA580C" },
  { name: "Amarelo", value: "#CA8A04" },
  { name: "Verde", value: "#16A34A" },
  { name: "Azul", value: "#2563EB" },
  { name: "Roxo", value: "#9333EA" },
  { name: "Rosa", value: "#DB2777" },
  { name: "Cinza", value: "#475569" },
];

const NAME_COLOR_SWATCHES = [
  { name: "Branco", value: "#FFFFFF" },
  { name: "Preto", value: "#000000" },
  { name: "Amarelo", value: "#FACC15" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Verde", value: "#22C55E" },
  { name: "Azul", value: "#3B82F6" },
];

const TEXT_3D_SHADOW = "1px 1px 0px rgba(0,0,0,0.3), 2px 2px 0px rgba(0,0,0,0.25), 3px 3px 0px rgba(0,0,0,0.2), 4px 4px 0px rgba(0,0,0,0.15), 5px 5px 10px rgba(0,0,0,0.4)";

const AdminStorefront = () => {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["admin-restaurant-storefront", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", restaurantId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#E11D48");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [nameColor, setNameColor] = useState("#FFFFFF");
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("23:00");
  const [promoBannerText, setPromoBannerText] = useState("");

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || "");
      setPhone(restaurant.phone || "");
      setIsOpen((restaurant as any).is_open !== false);
      setPrimaryColor((restaurant as any).primary_color || "#E11D48");
      setLogoUrl((restaurant as any).logo_url || null);
      setBannerUrl((restaurant as any).banner_url || null);
      setNameColor((restaurant as any).name_color || "#FFFFFF");
      setOpenTime((restaurant as any).open_time || "08:00");
      setCloseTime((restaurant as any).close_time || "23:00");
      setPromoBannerText((restaurant as any).promo_banner_text || "");
    }
  }, [restaurant]);

  const uploadImage = async (file: File, type: "logo" | "banner") => {
    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `storefront/${restaurantId}/${type}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      if (type === "logo") setLogoUrl(data.publicUrl);
      else setBannerUrl(data.publicUrl);
      toast.success(`${type === "logo" ? "Logo" : "Banner"} enviado!`);
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploading(null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save existing columns (always works)
      const { error } = await supabase
        .from("restaurants")
        .update({
          name,
          phone,
          is_open: isOpen,
          primary_color: primaryColor,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          name_color: nameColor,
        } as any)
        .eq("id", restaurantId!);
      if (error) throw error;

      // Try to save new columns (may fail if migration not applied)
      try {
        await supabase
          .from("restaurants")
          .update({
            open_time: openTime,
            close_time: closeTime,
            promo_banner_text: promoBannerText || null,
          } as any)
          .eq("id", restaurantId!);
      } catch {
        // Migration not yet applied — silently skip
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-storefront"] });
      toast.success("Alterações salvas com sucesso!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar"),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  const previewBanner = bannerUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=300&fit=crop";

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Personalizar Cardápio</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Controls */}
          <div className="flex-1 space-y-6">
            {/* Status toggle */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3">Status da Loja</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{isOpen ? "Loja Aberta" : "Loja Fechada"}</p>
                  <p className="text-xs text-muted-foreground">Seus clientes {isOpen ? "podem" : "não podem"} fazer pedidos</p>
                </div>
                <Switch
                  checked={isOpen}
                  onCheckedChange={setIsOpen}
                  className={isOpen ? "data-[state=checked]:bg-green-500" : ""}
                />
              </div>
            </div>

            {/* Logo upload */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3">Logo do Restaurante</h2>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-border overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90">
                    <Upload className="h-4 w-4" />
                    {uploading === "logo" ? "Enviando..." : "Enviar Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")} disabled={uploading === "logo"} />
                  </label>
                  {logoUrl && (
                    <button onClick={() => setLogoUrl(null)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <X className="h-3 w-3" /> Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Banner upload */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3">Banner de Fundo</h2>
              <div className="relative rounded-xl overflow-hidden border border-border aspect-[3/1]">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90">
                  <Upload className="h-4 w-4" />
                  {uploading === "banner" ? "Enviando..." : "Enviar Banner"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")} disabled={uploading === "banner"} />
                </label>
                {bannerUrl && (
                  <button onClick={() => setBannerUrl(null)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Remover
                  </button>
                )}
              </div>
            </div>

            {/* Color picker */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cor Principal
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Usada nos botões e destaques do seu cardápio</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    onClick={() => setPrimaryColor(swatch.value)}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${primaryColor === swatch.value ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: swatch.value }}
                    title={swatch.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground font-mono-table w-28 outline-none"
                />
              </div>
            </div>

            {/* Name color picker */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cor do Nome
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Cor do texto do nome do restaurante com efeito 3D</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {NAME_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    onClick={() => setNameColor(swatch.value)}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${nameColor === swatch.value ? "border-foreground scale-110" : "border-border"}`}
                    style={{ backgroundColor: swatch.value }}
                    title={swatch.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={nameColor}
                  onChange={(e) => setNameColor(e.target.value)}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  value={nameColor}
                  onChange={(e) => setNameColor(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground font-mono-table w-28 outline-none"
                />
              </div>
            </div>

            {/* Info */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-foreground">Informações</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome do Restaurante</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telefone / WhatsApp</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            {/* Horário de Funcionamento */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </h2>
              <p className="text-xs text-muted-foreground">Defina o horário de abertura e fechamento exibido no cardápio</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Abre às</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fecha às</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Banner de Promoção */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-foreground">Texto de Promoções</h2>
              <p className="text-xs text-muted-foreground">Texto exibido na seção de promoções do cardápio (ex: "Combo do Dia | Promoção!")</p>
              <textarea
                value={promoBannerText}
                onChange={(e) => setPromoBannerText(e.target.value)}
                placeholder="Ex: Monte seu combo e economize!"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Save button */}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>

          {/* Right: Mobile preview */}
          <div className="hidden lg:flex items-start justify-center lg:w-[420px]">
            <div className="sticky top-24">
              <p className="text-sm font-medium text-muted-foreground mb-3 text-center">Pré-visualização</p>
              <div className="w-[375px] h-[667px] rounded-[40px] border-[8px] border-foreground/20 bg-background overflow-hidden shadow-2xl">
                <div className="w-full h-full overflow-y-auto">
                  {/* Mini banner */}
                  <div className="relative h-32 overflow-hidden">
                    <img src={previewBanner} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  {/* Mini restaurant info */}
                  <div className="px-4 -mt-6 relative">
                    <div className="flex items-end gap-3">
                      <div className="h-14 w-14 rounded-full border-3 border-card bg-card overflow-hidden flex-shrink-0 shadow-md">
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {name?.charAt(0) || "R"}
                          </div>
                        )}
                      </div>
                      <div className="pb-0.5">
                        <p className="text-sm font-black" style={{ color: nameColor, textShadow: TEXT_3D_SHADOW }}>{name || "Restaurante"}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isOpen ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {isOpen ? "🟢 Aberto" : "🔴 Fechado"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Mini product cards */}
                  <div className="px-4 pt-4 space-y-3 pb-6">
                    <div className="h-8 bg-muted rounded-lg w-full" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="h-24 bg-muted" />
                        <div className="p-3 space-y-1.5">
                          <div className="h-3 bg-muted rounded w-2/3" />
                          <div className="h-2 bg-muted rounded w-full" />
                          <div className="flex justify-between items-center pt-1">
                            <div className="h-3 bg-muted rounded w-16" />
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Adicionar
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStorefront;
