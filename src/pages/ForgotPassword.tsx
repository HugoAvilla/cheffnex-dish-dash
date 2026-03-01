import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoText from "@/assets/logo-text.png";
import loginHero from "@/assets/login-hero.jpg";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Por favor, insira seu e-mail.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/admin/reset-password`,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message);
        } else {
            setSent(true);
            toast.success("E-mail de recuperação enviado!");
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <img src={loginHero} alt="Restaurant" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30" />
                <div className="relative z-10 flex flex-col justify-end p-12">
                    <h2 className="text-3xl font-bold text-primary-foreground mb-2">Recupere o acesso à sua conta</h2>
                    <p className="text-primary-foreground/80">Enviaremos um link de redefinição para seu e-mail.</p>
                </div>
            </div>

            {/* Right - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex flex-col items-center">
                        <img src={logoText} alt="CheffNex" className="h-16 mb-6" />
                        <h1 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h1>
                        <p className="text-muted-foreground mt-1 text-center">
                            {sent
                                ? "Verifique sua caixa de entrada e clique no link enviado."
                                : "Digite seu e-mail para receber o link de recuperação."}
                        </p>
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? "Enviando..." : "Enviar link de recuperação"}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                E-mail enviado para <strong className="text-foreground">{email}</strong>. Se não encontrar, verifique a pasta de spam.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail(""); }}
                                className="text-sm text-primary hover:underline"
                            >
                                Enviar novamente
                            </button>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/admin/login" className="text-sm text-primary hover:underline">
                            ← Voltar ao login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
