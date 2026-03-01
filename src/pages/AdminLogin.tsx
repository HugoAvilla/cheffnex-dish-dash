import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import loginHero from "@/assets/login-hero.jpg";
import logoText from "@/assets/logo-text.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={loginHero} alt="Restaurant" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h2 className="text-3xl font-bold text-primary-foreground mb-2">Gerencie seu restaurante com inteligência</h2>
          <p className="text-primary-foreground/80">Controle estoque, pedidos e cardápio em um só lugar.</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center">
            <img src={logoText} alt="CheffNex" className="h-16 mb-6" />
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
            <p className="text-muted-foreground mt-1">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex justify-end">
              <Link to="/admin/forgot-password" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
