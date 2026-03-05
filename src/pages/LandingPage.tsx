import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const TIMER_KEY = "cheffnex_offer_end";
const TIMER_DURATION = 90 * 60 * 1000; // 1h30m

const getEnd = (): number => {
    const stored = localStorage.getItem(TIMER_KEY);
    if (stored) {
        const end = parseInt(stored, 10);
        if (end > Date.now()) return end;
    }
    const end = Date.now() + TIMER_DURATION;
    localStorage.setItem(TIMER_KEY, String(end));
    return end;
};

const fmt = (ms: number) => {
    if (ms <= 0) return { h: "00", m: "00", s: "00" };
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return { h, m, s };
};

const CountdownInline = ({ time, label }: { time: { h: string; m: string; s: string }; label?: string }) => (
    <div className="cd-inline">
        {label && <p className="cd-label">{label}</p>}
        <div className="cd-digits">
            <div className="cd-box"><span className="cd-num">{time.h}</span><span className="cd-unit">horas</span></div>
            <span className="cd-sep">:</span>
            <div className="cd-box"><span className="cd-num">{time.m}</span><span className="cd-unit">min</span></div>
            <span className="cd-sep">:</span>
            <div className="cd-box"><span className="cd-num">{time.s}</span><span className="cd-unit">seg</span></div>
        </div>
    </div>
);

const LandingPage = () => {
    const [timeLeft, setTimeLeft] = useState(fmt(getEnd() - Date.now()));
    const [showSticky, setShowSticky] = useState(false);

    useEffect(() => {
        const end = getEnd();
        const tick = setInterval(() => {
            const diff = end - Date.now();
            setTimeLeft(fmt(diff));
            if (diff <= 0) clearInterval(tick);
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    useEffect(() => {
        const onScroll = () => setShowSticky(window.scrollY > 600);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        const els: HTMLElement[] = [];
        const add = (tag: string, attrs: Record<string, string>, parent = document.head) => {
            const el = document.createElement(tag) as any;
            Object.entries(attrs).forEach(([k, v]) => (el[k] = v));
            parent.appendChild(el);
            els.push(el);
            return el;
        };
        add("link", { rel: "preconnect", href: "https://fonts.googleapis.com" });
        add("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" });
        add("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap" });
        add("link", { rel: "stylesheet", href: "https://unpkg.com/aos@2.3.1/dist/aos.css" });
        const aos = add("script", { src: "https://unpkg.com/aos@2.3.1/dist/aos.js" }, document.body);
        aos.onload = () => (window as any).AOS?.init({ once: true, offset: 50, duration: 600 });
        const luc = add("script", { src: "https://unpkg.com/lucide@latest" }, document.body);
        luc.onload = () => (window as any).lucide?.createIcons();
        return () => els.forEach((e) => e.parentNode?.removeChild(e));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => { (window as any).lucide?.createIcons(); (window as any).AOS?.refresh(); }, 600);
        return () => clearTimeout(t);
    });

    const features = [
        "Gestão de Estoque Completa com alertas automáticos",
        "Histórico de Estoque com rastreabilidade total",
        "Requisição de Compras organizada e prática",
        "Precificação Inteligente com análise de custos",
        "Fichas Técnicas Profissionais em PDF",
        "Gestão de Equipe com permissões personalizadas",
        "Usuários Ilimitados — cadastre toda sua equipe",
        "Produtos Ilimitados — sem limite de cadastros",
        "Acesso Mobile e Desktop",
    ];

    return (
        <div className="lp">
            <div className="glow" />

            {/* TRUST BADGE */}
            <div className="trust-top">
                🔥 Mais de restaurantes já recuperaram margem eliminando desperdício invisível na cozinha.
            </div>

            {/* STICKY COUNTDOWN BAR */}
            <div className={`sticky-bar ${showSticky ? "visible" : ""}`}>
                <div className="ct" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: ".85rem" }}>🔥 OFERTA EXPIRA EM:</span>
                    <div className="cd-digits cd-sm">
                        <div className="cd-box-sm"><span className="cd-num-sm">{timeLeft.h}</span></div>
                        <span className="cd-sep-sm">:</span>
                        <div className="cd-box-sm"><span className="cd-num-sm">{timeLeft.m}</span></div>
                        <span className="cd-sep-sm">:</span>
                        <div className="cd-box-sm"><span className="cd-num-sm">{timeLeft.s}</span></div>
                    </div>
                    <a href="#pricing" style={{ background: "#fff", color: "var(--bg)", padding: "6px 16px", borderRadius: 100, fontWeight: 700, fontSize: ".8rem", fontFamily: "'Outfit'" }}>GARANTIR AGORA</a>
                </div>
            </div>

            {/* NAV */}
            <nav className="lp-nav">
                <div className="ct">
                    <a href="#" className="logo">
                        <div className="logo-ic"><i data-lucide="chef-hat" color="white" data-size="20" /></div>
                        Cheffnex
                    </a>
                    <Link to="/admin/login" className="btn-enter">ENTRAR</Link>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero">
                <div className="ct">
                    <h1 data-aos="fade-up" data-aos-duration="1000">
                        O dinheiro do seu restaurante não some.<br />
                        <span style={{ fontStyle: "italic", color: "var(--pr)" }}>Ele apodrece no estoque.</span>
                    </h1>
                    <p className="sub" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
                        O Cheffnex mostra exatamente onde o desperdício está comendo sua margem.
                    </p>
                    <div className="hero-acts" data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000">
                        <a href="#pricing" className="btn btn-hero">👍 Quero Estancar meu desperdício AGORA</a>
                    </div>

                    <div className="dash-wrap" data-aos="zoom-in-up" data-aos-duration="1200" data-aos-delay="300">
                        <div className="fc fc-1">
                            <div className="fc-i red"><i data-lucide="alert-triangle" /></div>
                            <div className="fc-t"><h4>Alerta de Desperdício</h4><p>Consumo acima da média</p></div>
                        </div>
                        <div className="fc fc-2">
                            <div className="fc-i org"><i data-lucide="trending-down" /></div>
                            <div className="fc-t"><h4>Margem Afetada</h4><p>Prejuízo Evitável: R$ 450</p></div>
                        </div>
                        <div className="fc fc-3">
                            <div className="fc-t"><h4>Insumos</h4><p>Análise de Saída</p></div>
                        </div>
                        <div className="dash">
                            <div className="mock-ov">
                                <i data-lucide="bar-chart-3" data-size="48" style={{ color: "var(--pr)", marginBottom: 16 }} />
                                <h3 style={{ color: "#fff" }}>Painel Visão Geral de Controle</h3>
                                <p>Gráficos de Insumos • Impacto na Margem • Alertas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DOR */}
            <section className="pain">
                <div className="ct">
                    <div className="st" data-aos="fade-up">
                        <h2>O Caos Invisível do Restaurante</h2>
                        <p>Todo restaurante perde dinheiro. O problema é quando ninguém sabe onde.</p>
                    </div>
                    <div className="pain-list" data-aos="fade-up" data-aos-delay="100">
                        {[
                            ["Insumos vencem.", "clock-4"],
                            ["Porções saem diferentes.", "scale"],
                            ["Compras são feitas \"por segurança\".", "shield-alert"],
                            ["O estoque fecha no papel — mas o caixa não.", "file-warning"],
                            ["Chega de planilhas que não batem.", "table-2"],
                            ["Chega de estoque no achismo.", "help-circle"],
                            ["Chega de trabalhar 14 horas por dia sem saber se teve lucro.", "clock"],
                        ].map(([t, icon], i) => (
                            <div className="pain-it" key={i}>
                                <i data-lucide={icon} data-size="24" color="var(--no)" />
                                <p style={{ fontWeight: 500 }}>{t}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: "center", marginTop: 60, maxWidth: 600, marginInline: "auto" }} data-aos="fade-up">
                        <p style={{ fontFamily: "'Outfit'", fontSize: "1.4rem", fontWeight: 500, fontStyle: "italic", color: "#fff", marginBottom: 24 }}>
                            "A gente vendeu bem… mas por que o lucro não apareceu no fim do mês?"
                        </p>
                        <p style={{ color: "var(--txm)", fontSize: "1.1rem" }}>
                            O prejuízo não grita. Ele apodrece silenciosamente no estoque, todos os dias.
                        </p>
                    </div>
                </div>
            </section>

            {/* PONTE */}
            <section className="bridge">
                <div className="ct">
                    <div className="bridge-box" data-aos="fade-up">
                        <h2>O Cheffnex <span className="hl">não</span> é mais um painel de avião cheio de gráficos que você não entende.</h2>
                        <p>Ele é um aplicativo <span className="hl">limpo, rápido</span> e tão fácil de usar quanto mandar uma mensagem no WhatsApp.</p>
                        <p style={{ marginTop: 24, color: "#fff", fontWeight: 600, fontSize: "1.3rem", fontFamily: "'Outfit'" }}>
                            Veja exatamente o que você terá em suas mãos nos próximos 3 minutos:
                        </p>
                    </div>
                </div>
            </section>

            {/* BULLET SECRETS */}
            <section>
                <div className="ct">
                    <div className="st" data-aos="fade-up">
                        <div className="badge" style={{ marginBottom: 24 }}>A Solução Cheffnex</div>
                        <h2>O sistema que transforma desperdício em <span style={{ color: "var(--pr)" }}>controle real.</span></h2>
                    </div>
                    <div className="bullets">
                        <div className="bullet" data-aos="fade-up" data-aos-delay="100">
                            <span className="bullet-emoji">🔒</span>
                            <h3>A Tecnologia "Alerta Anti-Ralo"</h3>
                            <p>O segredo de 3 cliques que transforma o seu celular em um <strong>"cão de guarda"</strong> do seu estoque. Ele te avisa automaticamente quais lotes estão perto de vencer, para você lucrar com eles antes que virem lixo.</p>
                            <span className="tag">💰 Só isso já paga o sistema no primeiro mês</span>
                        </div>
                        <div className="bullet" data-aos="fade-up" data-aos-delay="200">
                            <span className="bullet-emoji">🎯</span>
                            <h3>A Técnica do "Cardápio Magnético de 1 Clique"</h3>
                            <p>Pare de enviar PDFs feios e desatualizados. Você terá um <strong>link elegante</strong> com todos os seus pratos, onde você atualiza os preços na hora, sem precisar implorar para um designer.</p>
                        </div>
                        <div className="bullet" data-aos="fade-up" data-aos-delay="300">
                            <span className="bullet-emoji">💰</span>
                            <h3>O Truque do "Caixa Blindado"</h3>
                            <p>Como fechar o seu financeiro em menos de <strong>40 segundos</strong>, sabendo exatamente para onde foi cada centavo, bloqueando de vez qualquer chance de "furto formiga" na sua operação.</p>
                        </div>
                        <div className="bullet" data-aos="fade-up" data-aos-delay="400">
                            <span className="bullet-emoji">🚫</span>
                            <h3>O Fim do "Trauma da Ruptura"</h3>
                            <p>Por que você <strong>NUNCA</strong> mais precisará ir até a mesa pedir desculpas ao cliente por falta de ingrediente, usando o nosso monitoramento de baixa automática.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENTO BOX */}
            <section style={{ backgroundColor: "#0E0D0C" }}>
                <div className="ct">
                    <div className="st" data-aos="fade-up">
                        <h2>Muito Além do Estoque</h2>
                        <p>O desperdício é a porta de entrada. Mas o Cheffnex entrega controle total da sua operação.</p>
                    </div>
                    <div className="bento">
                        <div className="bc" data-aos="fade-up" data-aos-delay="100">
                            <div style={{ marginBottom: 24, color: "var(--pr)" }}><i data-lucide="menu-square" data-size="32" /></div>
                            <h3>🍽️ Cardápio Inteligente que Vende</h3>
                            <p>Seu cardápio deixa de ser vergonha e vira <strong>ferramenta de venda</strong>.</p>
                            <ul><li>Criação e edição em minutos</li><li>Preços, descrições, imagens e variações</li><li>Link bonito para enviar ao cliente</li><li>Atualização instantânea (sem PDF, sem designer)</li></ul>
                            <p style={{ marginTop: 16, color: "var(--pr)", fontWeight: 600, fontSize: ".9rem" }}>📌 Mudou o preço do insumo? Dois cliques e pronto.</p>
                        </div>
                        <div className="bc bc-vt" data-aos="fade-up" data-aos-delay="200">
                            <div>
                                <div style={{ marginBottom: 24, color: "#4DA8DA" }}><i data-lucide="shopping-cart" data-size="32" /></div>
                                <h3>Pedidos Sem Fricção</h3>
                                <p>Pedido vira fluxo contínuo. Não confusão no meio do salão ou na tela.</p>
                                <div style={{ marginTop: 32 }}>
                                    <p style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Para o cliente:</p>
                                    <ul><li>Pedido simples</li><li>Carrinho claro</li><li>Finalização rápida</li></ul>
                                    <p style={{ color: "#fff", fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Para o restaurante:</p>
                                    <ul><li>Pedidos organizados</li><li>Menos erro</li><li>Mais velocidade</li></ul>
                                </div>
                            </div>
                        </div>
                        <div className="bc" data-aos="fade-up" data-aos-delay="300">
                            <div style={{ marginBottom: 24, color: "var(--ok)" }}><i data-lucide="package" data-size="32" /></div>
                            <h3>📦 Controle de Estoque sem Achismo</h3>
                            <p>Aqui o estoque para de ser um <strong>cemitério de dinheiro</strong>.</p>
                            <ul><li>Produtos conectados aos insumos</li><li>Visão clara do que entra e do que sai</li><li>Redução real de desperdício</li><li>Base sólida para controlar CMV</li></ul>
                            <p style={{ marginTop: 16, color: "var(--ok)", fontWeight: 600, fontSize: ".9rem" }}>📌 Você sabe o que tem, o que falta e onde está vazando.</p>
                        </div>
                        <div className="bc bc-lg" data-aos="fade-up" data-aos-delay="400">
                            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: 250 }}>
                                    <div style={{ marginBottom: 16, color: "#DDAA00" }}><i data-lucide="bar-chart-2" data-size="24" /></div>
                                    <h3>📊 Gestão Simples para Decidir Melhor</h3>
                                    <p>Nada de gráfico inútil ou painel da NASA. Visão real de vendas, produtos mais rentáveis e leitura clara do resultado.</p>
                                    <p style={{ marginTop: 8, color: "#DDAA00", fontWeight: 600, fontSize: ".85rem" }}>📌 Você deixa de "achar" e passa a saber.</p>
                                </div>
                                <div style={{ flex: 1, minWidth: 250 }}>
                                    <div style={{ marginBottom: 16, color: "#1EBD60" }}><i data-lucide="dollar-sign" data-size="24" /></div>
                                    <h3>Financeiro Simplificado</h3>
                                    <p>O dono para de perguntar "Será que lucrei?" e passa a saber com clareza.</p>
                                </div>
                                <div style={{ flex: 1, minWidth: 250 }}>
                                    <div style={{ marginBottom: 16, color: "#A09E9C" }}><i data-lucide="palette" data-size="24" /></div>
                                    <h3>Templates e Marca</h3>
                                    <p>Você entrega presença com identidades e templates personalizados.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BÔNUS */}
            <section className="bonus-section">
                <div className="ct">
                    <div className="st" data-aos="fade-up">
                        <h2>E tem mais… <span style={{ color: "var(--pr)" }}>Bônus exclusivos.</span></h2>
                        <p>Quem ativa o Cheffnex hoje leva junto ferramentas que eliminam qualquer desculpa para não começar.</p>
                    </div>
                    <div className="bonus-grid">
                        <div className="bonus-card" data-aos="fade-up" data-aos-delay="100">
                            <span className="bonus-tag">🎁 BÔNUS 1</span>
                            <h3>A Biblioteca "Cópia e Cola" de Cardápios Pré-Configurados</h3>
                            <p>Quando acessar a plataforma, terá à disposição <strong>modelos de cardápios completos e estruturados</strong> para o seu nicho (Pizzaria, Hambúrguer, Sushi, Comida Tradicional, etc.).</p>
                            <p style={{ marginTop: 12, color: "#fff", fontWeight: 500 }}>Selecione o template, altere os nomes, coloque seus preços e clique em salvar. Seu cardápio digital estará online em menos de 15 minutos.</p>
                            <div className="bonus-val"><span className="old">Valor: R$ 197</span><span className="new">Hoje: GRÁTIS</span></div>
                        </div>
                        <div className="bonus-card" data-aos="fade-up" data-aos-delay="200">
                            <span className="bonus-tag">🎁 BÔNUS 2</span>
                            <h3>O "Assistente Invisível" de Treino Interativo</h3>
                            <p>Nós sabemos que na cozinha não há tempo para assistir horas de vídeos de tutoriais chatos. Por isso, integramos no próprio app <strong>abas de ajuda visuais e ultrarrápidas</strong>.</p>
                            <p style={{ marginTop: 12, color: "#fff", fontWeight: 500 }}>Se na hora do serviço seu funcionário tiver uma dúvida, ele toca no ecrã e o sistema mostra o passo exato. Zero interrupção no serviço.</p>
                            <div className="bonus-val"><span className="old">Valor: Inestimável</span><span className="new">Incluído GRÁTIS</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROVA SOCIAL */}
            <section>
                <div className="ct">
                    <div className="st" data-aos="fade-up">
                        <h2>Quem usa, comprova.</h2>
                        <p>Donos de restaurante reais. Resultados reais. Sem figuração.</p>
                    </div>
                    <div className="tg">
                        <div className="tc" data-aos="fade-up" data-aos-delay="100">
                            <div>
                                <p style={{ color: "#DDAA00", marginBottom: 12, fontSize: "1.1rem" }}>⭐⭐⭐⭐⭐</p>
                                <p className="qt">"Eu trabalhava muito e nunca via dinheiro. O Cheffnex foi o primeiro sistema que minha equipe conseguiu usar sem reclamar. Hoje sei exatamente onde estou ganhando e onde estava perdendo."</p>
                            </div>
                            <p className="rs">— João, dono de hamburgueria</p>
                        </div>
                        <div className="tc" style={{ backgroundColor: "#12100F" }} data-aos="fade-up" data-aos-delay="200">
                            <div>
                                <p style={{ color: "#DDAA00", marginBottom: 12, fontSize: "1.1rem" }}>⭐⭐⭐⭐⭐</p>
                                <p className="qt">"Meu estoque era um ralo invisível. Em poucas semanas, já reduzi desperdício e parei de jogar comida fora. Dormi tranquila pela primeira vez em anos."</p>
                            </div>
                            <p className="rs">— Carla, restaurante familiar</p>
                        </div>
                        <div className="tc" data-aos="fade-up" data-aos-delay="300">
                            <div>
                                <p style={{ color: "#DDAA00", marginBottom: 12, fontSize: "1.1rem" }}>⭐⭐⭐⭐⭐</p>
                                <p className="qt">"Achei que sistema não era pra mim. O Cheffnex provou o contrário. É simples, visual e não trava no rush."</p>
                            </div>
                            <p className="rs">— Marcos, pizzaria delivery</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="pricing">
                <div className="ct">
                    <div className="st" data-aos="fade-up">
                        <h2>Quanto custa <span style={{ color: "var(--pr)" }}>não</span> controlar o estoque?</h2>
                        <p>Um insumo vencido, um erro de porcionamento, uma semana sem visibilidade… Tudo isso custa mais do que o Cheffnex.</p>
                    </div>
                    <CountdownInline time={timeLeft} label="⏰ Oferta por tempo limitado — garanta o preço promocional:" />
                    <div className="price-grid">
                        {/* MENSAL */}
                        <div className="price-card" data-aos="fade-up" data-aos-delay="100">
                            <span className="plan-tag test">Ideal para testar</span>
                            <h3 className="plan-name fo">Mensal</h3>
                            <p className="price-old">De R$ 197</p>
                            <p className="price-val">R$ 67<span>/mês</span></p>
                            <p className="price-period">Cancele quando quiser</p>
                            <ul className="feat-list">
                                {features.map((f, i) => (
                                    <li key={i}><span className="ck">✓</span><span><strong>{f.split(" ")[0]} {f.split(" ")[1]}</strong> {f.split(" ").slice(2).join(" ")}</span></li>
                                ))}
                            </ul>
                            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="btn btn-s" style={{ width: "100%", marginTop: 16 }}>
                                Começar agora
                            </a>
                        </div>
                        {/* ANUAL */}
                        <div className="price-card pop" data-aos="fade-up" data-aos-delay="200">
                            <span className="pop-badge">🔥 MAIS POPULAR</span>
                            <span className="plan-tag best" style={{ marginTop: 24 }}>Melhor custo-benefício</span>
                            <h3 className="plan-name fo">Anual</h3>
                            <span className="save-badge">Economize mais de 50%</span>
                            <p className="price-old">De R$ 997</p>
                            <p className="price-val">12x</span> R$ 39,90<span> /mês</span></p>
                        <p className="price-period">Acesso por 1 ano completo</p>
                        <ul className="feat-list">
                            <li><span className="ck">✓</span><span style={{ color: "#fff", fontWeight: 600 }}>✨ TUDO do plano Mensal +</span></li>
                            {features.map((f, i) => (
                                <li key={i}><span className="ck">✓</span><span><strong>{f.split(" ")[0]} {f.split(" ")[1]}</strong> {f.split(" ").slice(2).join(" ")}</span></li>
                            ))}
                        </ul>
                        <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="btn btn-cta" style={{ width: "100%", marginTop: 16 }}>
                            👉 Quero eliminar o desperdício
                        </a>
                    </div>
                </div>
        </div>
            </section >

    {/* FAQ */ }
    < section >
    <div className="ct">
        <div className="st"><h2>Ainda tem dúvida?</h2></div>
        <div className="faq-list">
            {[
                ["Preciso mudar toda minha operação?", "Não. O Cheffnex se adapta ao fluxo que você já usa. Sem dor de cabeça."],
                ["Minha equipe vai conseguir usar?", "Sim. O sistema foi feito para funcionar no meio do rush. E o Bônus 2 (Assistente Invisível) treina sua equipe em tempo real."],
                ["E se eu não tiver tempo para configurar?", "Nossos templates pré-configurados resolvem isso. Em 15 minutos seu cardápio está no ar."],
                ["Vocês ajudam na configuração?", "Sim. Cardápio e estrutura inicial têm suporte total da nossa equipe."],
                ["Funciona para restaurante pequeno?", "Principalmente. Onde a margem é curta, o desperdício dói mais. E é onde o Cheffnex mais brilha."],
                ["É só controle de estoque?", "Não. Estoque é o começo. O controle se estende a cardápio, pedidos, vendas e financeiro completo."],
                ["E se não funcionar para mim?", "Você tem 7 dias de teste sem risco. Se não enxergar resultado, cancela com 1 clique. Sem perguntas."],
            ].map(([q, a], i) => (
                <div className="faq-it" key={i} data-aos="fade-up" data-aos-delay={String(i * 50 + 100)}>
                    <strong>{q}</strong><p>{a}</p>
                </div>
            ))}
        </div>
    </div>
            </section >

    {/* CTA FINAL */ }
    < section className = "final-cta" >
        <div className="ct">
            <div className="cta-box" data-aos="zoom-in" data-aos-duration="1000">
                <h2 style={{ fontSize: "2rem", marginBottom: 16 }} className="fo">O próximo passo é simples.</h2>
                <p style={{ color: "var(--txm)", fontSize: "1.15rem", marginBottom: 8 }}>
                    Ative o Cheffnex agora. Configure em minutos. Veja onde está perdendo dinheiro <strong style={{ color: "#fff" }}>ainda hoje</strong>.
                </p>
                <CountdownInline time={timeLeft} label="⏰ Esta oferta expira em:" />
                <div className="micro-g">
                    <span><i data-lucide="shield-check" data-size="18" style={{ color: "var(--ok)" }} /> 7 dias grátis</span>
                    <span><i data-lucide="credit-card" data-size="18" style={{ color: "var(--ok)" }} /> Cancele quando quiser</span>
                    <span><i data-lucide="lock" data-size="18" style={{ color: "var(--ok)" }} /> Pagamento seguro</span>
                </div>
                <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="btn btn-cta" style={{ width: "100%", fontSize: "1.2rem", padding: 20 }}>
                    👉 Quero eliminar o desperdício agora
                </a>
                <p style={{ marginTop: 16, color: "#555", fontSize: ".85rem" }}>Sem compromisso. Sem letras miúdas. Sem surpresas.</p>
            </div>
        </div>
            </section >

    {/* FOOTER */ }
    < footer className = "lp-ft" >
        <div className="ct">
            <div className="ft-grid">
                <div className="f-col">
                    <div className="logo-ic" style={{ marginBottom: 8 }}><i data-lucide="chef-hat" color="white" data-size="20" /></div>
                    <h2 className="fo" style={{ fontSize: "1.5rem", color: "#fff" }}>Cheffnex</h2>
                    <span style={{ maxWidth: 300 }}>Transformando desperdício invisível em controle real.</span>
                </div>
                <div className="f-col" style={{ textAlign: "right" }}>
                    <strong>Fale com Nosso Suporte</strong>
                    <span>Hugo Avila 17 99257-3141</span>
                    <span>Gmail Customapp01@gmail.com</span>
                    <span>São Jose do Rio Preto - São Paulo/SP</span>
                </div>
            </div>
            <div className="f-bot">
                <span>© 2026 Cheffnex. Todos os direitos reservados.</span>
                <div style={{ display: "flex", gap: 24 }}>
                    <a href="#">Termos de uso</a>
                    <a href="#">Política de privacidade</a>
                </div>
            </div>
        </div>
            </footer >
        </div >
    );
};

export default LandingPage;
