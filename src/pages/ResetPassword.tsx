import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoText from "@/assets/logo-text.png";
import loginHero from "@/assets/login-hero.jpg";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
        // Supabase automatically handles the token from the URL hash
        // and establishes a session when the user clicks the reset link
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setSessionReady(true);
            }
        });

        // Also check if session already exists (user may have already been redirected)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Senha atualizada com sucesso!");
            navigate("/admin/login");
        }
    };

    if (!sessionReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground">Verificando link de recuperação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <img src={loginHero} alt="Restaurant" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30" />
                <div className="relative z-10 flex flex-col justify-end p-12">
                    <h2 className="text-3xl font-bold text-primary-foreground mb-2">Crie uma nova senha</h2>
                    <p className="text-primary-foreground/80">Escolha uma senha segura para proteger sua conta.</p>
                </div>
            </div>

            {/* Right - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex flex-col items-center">
                        <img src={logoText} alt="CheffNex" className="h-16 mb-6" />
                        <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
                        <p className="text-muted-foreground mt-1">Digite sua nova senha abaixo.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Nova senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar nova senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? "Salvando..." : "Salvar nova senha"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
