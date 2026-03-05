import { useEffect } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  useEffect(() => {
    // Load AOS
    const aosCSS = document.createElement("link");
    aosCSS.rel = "stylesheet";
    aosCSS.href = "https://unpkg.com/aos@2.3.1/dist/aos.css";
    document.head.appendChild(aosCSS);

    const aosScript = document.createElement("script");
    aosScript.src = "https://unpkg.com/aos@2.3.1/dist/aos.js";
    aosScript.onload = () => {
      (window as any).AOS?.init({ once: true, offset: 50, duration: 600 });
    };
    document.body.appendChild(aosScript);

    // Load Lucide
    const lucideScript = document.createElement("script");
    lucideScript.src = "https://unpkg.com/lucide@latest";
    lucideScript.onload = () => {
      (window as any).lucide?.createIcons();
    };
    document.body.appendChild(lucideScript);

    // Load Google Fonts
    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap";
    document.head.appendChild(fontLink);

    return () => {
      // Cleanup
      [aosCSS, preconnect1, preconnect2, fontLink].forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      [aosScript, lucideScript].forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, []);

  // Re-initialize icons after render
  useEffect(() => {
    const timer = setTimeout(() => {
      (window as any).lucide?.createIcons();
      (window as any).AOS?.refresh();
    }, 500);
    return () => clearTimeout(timer);
  });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .landing-page {
          --bg-dark: #0A0908;
          --bg-card: #151312;
          --bg-card-hover: #1C1A19;
          --primary: #FF5A26;
          --primary-glow: rgba(255, 90, 38, 0.4);
          --text-main: #FFFFFF;
          --text-muted: #A09E9C;
          --border-color: rgba(255, 255, 255, 0.08);
          --border-hover: rgba(255, 90, 38, 0.3);
          --success: #1EBD60;
          --danger: #FF3B30;
          --radius-sm: 12px;
          --radius-md: 20px;
          --radius-lg: 32px;
          --radius-xl: 40px;
        }
        .landing-page * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        .landing-page {
          background-color: var(--bg-dark);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          line-height: 1.5;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        .landing-page h1, .landing-page h2, .landing-page h3, .landing-page h4, .landing-page .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
        .landing-page .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .landing-page section { padding: 100px 0; position: relative; }
        .landing-page a { text-decoration: none; }

        .landing-page .badge {
          display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px;
          background: rgba(255, 255, 255, 0.1); border: 1px solid var(--border-color);
          border-radius: 100px; font-size: 0.85rem; font-weight: 500; color: var(--text-main);
        }
        .landing-page .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px 32px; border-radius: 100px; font-weight: 600;
          font-family: 'Outfit', sans-serif; font-size: 1.1rem;
          transition: all 0.3s ease; cursor: pointer; border: none;
        }
        .landing-page .btn-primary {
          background: var(--text-main); color: var(--bg-dark);
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
        }
        .landing-page .btn-primary:hover {
          transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255, 255, 255, 0.25);
        }
        .landing-page .btn-secondary {
          background: rgba(255, 255, 255, 0.05); color: var(--text-main);
          border: 1px solid var(--border-color); font-size: 1rem; padding: 12px 24px;
        }
        .landing-page .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2);
        }
        .landing-page .btn-enter {
          background: var(--primary); color: #fff; padding: 10px 28px;
          border-radius: 100px; font-weight: 600; font-family: 'Outfit', sans-serif;
          font-size: 0.95rem; transition: all 0.3s ease; cursor: pointer; border: none;
          box-shadow: 0 4px 16px rgba(255, 90, 38, 0.3);
          letter-spacing: 0.5px;
        }
        .landing-page .btn-enter:hover {
          transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255, 90, 38, 0.5);
          background: #ff6e42;
        }

        .landing-page .trust-badge-top {
          background: linear-gradient(90deg, #FF5A26, #FF3B30);
          color: #FFFFFF; text-align: center; padding: 10px 16px;
          font-size: 0.9rem; font-weight: 600; position: relative; z-index: 1000;
        }
        .landing-page .glow-bg {
          position: absolute; width: 800px; height: 800px; border-radius: 50%;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 60%);
          filter: blur(80px); z-index: -1; pointer-events: none; opacity: 0.6;
        }
        .landing-page .glow-top { top: -200px; left: 50%; transform: translateX(-50%); }

        .landing-page .lp-nav {
          padding: 24px 0; position: absolute; width: 100%; top: 40px; z-index: 100;
        }
        .landing-page .lp-nav .lp-container {
          display: flex; justify-content: space-between; align-items: center;
        }
        .landing-page .logo {
          font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800;
          color: var(--text-main); display: flex; align-items: center; gap: 8px;
        }
        .landing-page .logo-icon {
          width: 32px; height: 32px; background: var(--primary); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .landing-page .hero {
          padding-top: 180px; padding-bottom: 60px; text-align: center; position: relative;
        }
        .landing-page .hero h1 {
          font-size: clamp(2.8rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.05;
          letter-spacing: -0.02em; margin: 24px auto; max-width: 900px;
          background: linear-gradient(180deg, #FFFFFF 0%, #D1D1D1 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .landing-page .hero p {
          font-size: 1.3rem; color: var(--text-muted); max-width: 600px;
          margin: 0 auto 40px; font-weight: 400;
        }
        .landing-page .hero-actions {
          display: flex; gap: 16px; justify-content: center; margin-bottom: 64px; flex-wrap: wrap;
        }

        .landing-page .hero-dashboard-wrapper {
          position: relative; max-width: 1000px; margin: 0 auto;
          border-radius: var(--radius-xl); padding: 12px;
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
        }
        .landing-page .hero-dashboard {
          border-radius: var(--radius-lg); overflow: hidden; position: relative;
          aspect-ratio: 16/9; background: var(--bg-card); border: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); font-family: 'Outfit'; font-size: 1.2rem;
          background-image: url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80');
          background-size: cover; background-position: center;
        }
        .landing-page .hero-dashboard::after {
          content: ''; position: absolute; inset: 0; background: rgba(10, 9, 8, 0.7);
        }
        .landing-page .mockup-text-overlay { position: relative; z-index: 2; text-align: center; }

        .landing-page .floating-card {
          position: absolute; background: rgba(20, 18, 18, 0.95);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px 20px;
          border-radius: var(--radius-md); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          display: flex; align-items: center; gap: 16px; z-index: 10;
        }
        .landing-page .fc-1 { top: 15%; left: -5%; }
        .landing-page .fc-2 { bottom: 20%; right: -5%; }
        .landing-page .fc-3 { top: 5%; right: 10%; }
        .landing-page .fc-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .landing-page .fc-icon.red { background: rgba(255, 59, 48, 0.15); color: var(--danger); }
        .landing-page .fc-icon.orange { background: rgba(255, 90, 38, 0.15); color: var(--primary); }
        .landing-page .fc-text h4 { font-size: 0.95rem; margin-bottom: 2px; }
        .landing-page .fc-text p { font-size: 0.85rem; color: var(--text-muted); }

        .landing-page .section-title { text-align: center; margin-bottom: 80px; }
        .landing-page .section-title h2 {
          font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 700;
          line-height: 1.1; margin-bottom: 16px;
        }
        .landing-page .section-title p { color: var(--text-muted); font-size: 1.2rem; max-width: 650px; margin: 0 auto; }

        .landing-page .pain-section {
          background: rgba(255, 255, 255, 0.01);
          border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);
        }
        .landing-page .pain-list {
          margin-top: 40px; display: flex; flex-direction: column; gap: 16px;
          max-width: 500px; margin-inline: auto; text-align: left;
        }
        .landing-page .pain-item {
          display: flex; align-items: center; gap: 16px; padding: 20px;
          background: rgba(255, 59, 48, 0.05); border-radius: var(--radius-sm);
          border-left: 4px solid var(--danger);
        }

        .landing-page .bullet-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px; margin-top: 60px;
        }
        .landing-page .bullet-item {
          padding-left: 24px; border-left: 2px solid var(--border-color); transition: border-color 0.3s;
        }
        .landing-page .bullet-item:hover { border-left-color: var(--primary); }
        .landing-page .bullet-item h3 { font-size: 1.3rem; margin-bottom: 8px; color: var(--text-main); }
        .landing-page .bullet-item p { color: var(--text-muted); font-size: 1.05rem; }

        .landing-page .bento-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(350px, auto); gap: 24px;
        }
        .landing-page .bento-card {
          background: linear-gradient(180deg, var(--bg-card) 0%, #0E0D0C 100%);
          border: 1px solid var(--border-color); border-radius: var(--radius-lg);
          padding: 40px; position: relative; overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column;
        }
        .landing-page .bento-card:hover {
          border-color: var(--border-hover); transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .landing-page .bento-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          z-index: 2;
        }
        .landing-page .bento-card h3 { font-size: 1.6rem; margin-bottom: 12px; position: relative; z-index: 2; }
        .landing-page .bento-card p { color: var(--text-muted); font-size: 1.05rem; position: relative; z-index: 2; }
        .landing-page .bento-card ul { list-style: none; margin-top: 24px; color: var(--text-muted); font-size: 0.95rem; }
        .landing-page .bento-card li { position: relative; padding-left: 20px; margin-bottom: 8px; }
        .landing-page .bento-card li::before { content: '•'; position: absolute; left: 0; color: var(--primary); }
        .landing-page .bento-large { grid-column: span 2; }
        .landing-page .bento-vertical { grid-row: span 2; display: flex; flex-direction: column; justify-content: space-between; }

        .landing-page .testimonial-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;
        }
        .landing-page .t-card {
          background-color: var(--bg-card); border-radius: var(--radius-lg); padding: 40px;
          border: 1px solid var(--border-color); position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between; min-height: 250px;
        }
        .landing-page .t-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%); z-index: 1;
        }
        .landing-page .t-card p.quote {
          font-size: 1.4rem; font-family: 'Outfit'; font-weight: 500; line-height: 1.4;
          color: var(--text-main); position: relative; z-index: 2; margin-bottom: 24px;
        }
        .landing-page .t-card p.result { font-weight: 700; color: var(--success); z-index: 2; position: relative; }

        .landing-page .offer-section {
          background: radial-gradient(circle at center, rgba(255, 90, 38, 0.1) 0%, var(--bg-dark) 70%);
          text-align: center; padding: 120px 0;
        }
        .landing-page .offer-box {
          max-width: 700px; margin: 0 auto; background: var(--bg-card);
          border: 1px solid rgba(255, 90, 38, 0.2); padding: 64px 40px;
          border-radius: var(--radius-lg); box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
        }

        .landing-page .faq-list {
          max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;
        }
        .landing-page .faq-item {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-sm); padding: 24px; transition: background 0.2s;
        }
        .landing-page .faq-item:hover { background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.1); }
        .landing-page .faq-item strong { display: block; font-family: 'Outfit'; font-size: 1.2rem; margin-bottom: 8px; }
        .landing-page .faq-item p { color: var(--text-muted); }

        .landing-page .lp-footer {
          border-top: 1px solid var(--border-color); padding: 60px 0 40px;
        }
        .landing-page .footer-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;
        }
        .landing-page .f-col { display: flex; flex-direction: column; gap: 12px; }
        .landing-page .f-col a { color: var(--text-muted); font-size: 0.9rem; transition: color 0.2s; }
        .landing-page .f-col a:hover { color: var(--text-main); }
        .landing-page .f-col span { color: var(--text-muted); font-size: 0.9rem; }
        .landing-page .f-bottom {
          border-top: 1px solid var(--border-color); padding-top: 24px;
          display: flex; justify-content: space-between; color: #555; font-size: 0.85rem;
        }

        @media (max-width: 992px) {
          .landing-page .bento-grid { grid-template-columns: 1fr 1fr; }
          .landing-page .bento-large { grid-column: span 2; }
          .landing-page .bento-vertical { grid-row: span 1; }
          .landing-page .fc-1, .landing-page .fc-2, .landing-page .fc-3 { display: none; }
          .landing-page .footer-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .landing-page .hero { padding-top: 120px; }
          .landing-page .bento-grid { grid-template-columns: 1fr; }
          .landing-page .bento-large { grid-column: span 1; }
          .landing-page .hero-dashboard-wrapper { margin: 0 16px; }
          .landing-page .bullet-grid { grid-template-columns: 1fr; }
          .landing-page .f-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `,
        }}
      />

      <div className="landing-page">
        <div className="glow-bg glow-top"></div>

        {/* 1. Barra de Topo */}
        <div className="trust-badge-top">
          Mais de restaurantes já recuperaram margem eliminando desperdício invisível na cozinha.
        </div>

        {/* Nav com botão ENTRAR */}
        <nav className="lp-nav">
          <div className="lp-container">
            <a href="#" className="logo">
              <div className="logo-icon">
                <i data-lucide="chef-hat" color="white" data-size="20"></i>
              </div>
              Cheffnex
            </a>
            <Link to="/admin/login" className="btn-enter">
              ENTRAR
            </Link>
          </div>
        </nav>

        {/* 2. Hero Section */}
        <section className="hero">
          <div className="lp-container">
            <h1 data-aos="fade-up" data-aos-duration="1000">
              O dinheiro do seu restaurante não some.<br />
              <span style={{ fontStyle: "italic", color: "var(--primary)" }}>
                Ele apodrece no estoque.
              </span>
            </h1>

            <p data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100">
              O Cheffnex mostra exatamente onde o desperdício está comendo sua margem.
            </p>

            <div className="hero-actions" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="200">
              <a href="#oferta" className="btn btn-primary">
                👉 Ver onde estou perdendo dinheiro
              </a>
              <a href="#oferta" className="btn btn-secondary">
                Começar teste gratuito
              </a>
            </div>

            <div
              className="hero-dashboard-wrapper"
              style={{ marginTop: "80px" }}
              data-aos="zoom-in-up"
              data-aos-duration="1200"
              data-aos-delay="300"
            >
              <div className="floating-card fc-1">
                <div className="fc-icon red">
                  <i data-lucide="alert-triangle"></i>
                </div>
                <div className="fc-text">
                  <h4>Alerta de Desperdício</h4>
                  <p>Consumo acima da média</p>
                </div>
              </div>

              <div className="floating-card fc-2">
                <div className="fc-icon orange">
                  <i data-lucide="trending-down"></i>
                </div>
                <div className="fc-text">
                  <h4>Margem Afetada</h4>
                  <p>Prejuízo Evitável: R$ 450</p>
                </div>
              </div>

              <div className="floating-card fc-3">
                <div className="fc-text">
                  <h4>Insumos</h4>
                  <p>Análise de Saída</p>
                </div>
              </div>

              <div className="hero-dashboard">
                <div className="mockup-text-overlay">
                  <i
                    data-lucide="bar-chart-3"
                    data-size="48"
                    style={{ color: "var(--primary)", marginBottom: "16px" }}
                  ></i>
                  <h3 style={{ color: "#fff" }}>Painel Visão Geral de Controle</h3>
                  <p>Gráficos de Insumos • Impacto na Margem • Alertas</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Agitação da Dor */}
        <section className="pain-section">
          <div className="lp-container">
            <div className="section-title" data-aos="fade-up">
              <h2>O Caos Invisível do Restaurante</h2>
              <p>Todo restaurante perde dinheiro. O problema é quando ninguém sabe onde.</p>
            </div>

            <div className="pain-list" data-aos="fade-up" data-aos-delay="100">
              <div className="pain-item">
                <i data-lucide="clock-4" data-size="24" color="var(--danger)"></i>
                <p style={{ fontWeight: 500 }}>Insumos vencem.</p>
              </div>
              <div className="pain-item">
                <i data-lucide="scale" data-size="24" color="var(--danger)"></i>
                <p style={{ fontWeight: 500 }}>Porções saem diferentes.</p>
              </div>
              <div className="pain-item">
                <i data-lucide="shield-alert" data-size="24" color="var(--danger)"></i>
                <p style={{ fontWeight: 500 }}>Compras são feitas "por segurança".</p>
              </div>
              <div className="pain-item">
                <i data-lucide="file-warning" data-size="24" color="var(--danger)"></i>
                <p style={{ fontWeight: 500 }}>O estoque fecha no papel — mas o caixa não.</p>
              </div>
            </div>

            <div
              style={{ textAlign: "center", marginTop: "60px", maxWidth: "600px", marginInline: "auto" }}
              data-aos="fade-up"
            >
              <p
                style={{
                  fontFamily: "'Outfit'",
                  fontSize: "1.4rem",
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: "#fff",
                  marginBottom: "24px",
                }}
              >
                "A gente vendeu bem… mas por que o lucro não apareceu no fim do mês?"
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
                O prejuízo não grita. Ele apodrece silenciosamente no estoque, todos os dias.
              </p>
            </div>
          </div>
        </section>

        {/* 4. A Solução */}
        <section>
          <div className="lp-container">
            <div className="section-title" data-aos="fade-up">
              <div className="badge" style={{ marginBottom: "24px" }}>
                Conheça o Cheffnex
              </div>
              <h2>
                O sistema que transforma desperdício em{" "}
                <span style={{ color: "var(--primary)" }}>controle real.</span>
              </h2>
              <p>
                O Cheffnex é uma plataforma de gestão gastronômica criada para centralizar operação,
                estoque, pedidos e financeiro em um único painel simples.
              </p>
              <br />
              <p style={{ fontWeight: 600, color: "#fff" }}>
                Você deixa de apagar incêndio e passa a enxergar, decidir e corrigir.
              </p>

              <div
                style={{
                  marginTop: "32px",
                  display: "inline-flex",
                  gap: "24px",
                  color: "var(--text-muted)",
                  fontFamily: "'Outfit'",
                  fontWeight: 500,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <span>
                  <i data-lucide="x" data-size="16" style={{ color: "var(--danger)" }}></i> Não é planilha.
                </span>
                <span>
                  <i data-lucide="x" data-size="16" style={{ color: "var(--danger)" }}></i> Não é sistema travado.
                </span>
                <span style={{ color: "#fff" }}>
                  <i data-lucide="check" data-size="16" style={{ color: "var(--success)" }}></i> É um cérebro
                  operacional.
                </span>
              </div>
            </div>

            {/* 5. Benefícios */}
            <div className="bullet-grid">
              <div className="bullet-item" data-aos="fade-up" data-aos-delay="100">
                <h3>O Botão Anti-Desperdício</h3>
                <p>Descubra exatamente quais insumos estão saindo além do esperado — antes que virem prejuízo.</p>
              </div>
              <div className="bullet-item" data-aos="fade-up" data-aos-delay="200">
                <h3>Estoque que fala a verdade</h3>
                <p>Cada venda impacta o estoque automaticamente. Sem "fechamento fake".</p>
              </div>
              <div className="bullet-item" data-aos="fade-up" data-aos-delay="300">
                <h3>Margem sob vigilância</h3>
                <p>Você vê onde o dinheiro está vazando e corrige rápido de forma constante.</p>
              </div>
              <div className="bullet-item" data-aos="fade-up" data-aos-delay="400">
                <h3>Lucro sem vender mais</h3>
                <p>Antes de tráfego, promoção ou delivery, você recupera margem que já estava perdida.</p>
              </div>
              <div className="bullet-item" data-aos="fade-up" data-aos-delay="500">
                <h3>Decisão baseada em dado</h3>
                <p>Você para de achar pela sensação. E passa a saber com números absolutos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Bento Box */}
        <section style={{ backgroundColor: "#0E0D0C" }}>
          <div className="lp-container">
            <div className="section-title" data-aos="fade-up">
              <h2>Muito Além do Estoque</h2>
              <p>O desperdício é a porta de entrada. Mas o Cheffnex entrega controle total da sua operação.</p>
            </div>

            <div className="bento-grid">
              <div className="bento-card" data-aos="fade-up" data-aos-delay="100">
                <div style={{ marginBottom: "24px", color: "var(--primary)" }}>
                  <i data-lucide="menu-square" data-size="32"></i>
                </div>
                <h3>Cardápio Inteligente</h3>
                <p>O cardápio deixa de ser estático e vira ferramenta ativa de venda.</p>
                <ul>
                  <li>Criação e edição rápida</li>
                  <li>Categorias personalizadas</li>
                  <li>Preços, imagens e variações</li>
                  <li>Preview em tempo real</li>
                </ul>
              </div>

              <div className="bento-card bento-vertical" data-aos="fade-up" data-aos-delay="200">
                <div>
                  <div style={{ marginBottom: "24px", color: "#4DA8DA" }}>
                    <i data-lucide="shopping-cart" data-size="32"></i>
                  </div>
                  <h3>Pedidos Sem Fricção</h3>
                  <p>Pedido vira fluxo contínuo. Não confusão no meio do salão ou na tela.</p>
                  <div style={{ marginTop: "32px" }}>
                    <p style={{ color: "#fff", fontWeight: 600, marginBottom: "8px" }}>Para o cliente:</p>
                    <ul>
                      <li>Pedido simples</li>
                      <li>Carrinho claro</li>
                      <li>Finalização rápida</li>
                    </ul>
                    <p style={{ color: "#fff", fontWeight: 600, marginTop: "24px", marginBottom: "8px" }}>
                      Para o restaurante:
                    </p>
                    <ul>
                      <li>Pedidos organizados</li>
                      <li>Menos erro</li>
                      <li>Mais velocidade</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bento-card" data-aos="fade-up" data-aos-delay="300">
                <div style={{ marginBottom: "24px", color: "var(--success)" }}>
                  <i data-lucide="package" data-size="32"></i>
                </div>
                <h3>Estoque Conectado à Realidade</h3>
                <p>O estoque deixa de ser achismo e passa a ser dado confiável.</p>
                <ul>
                  <li>Produtos ligados a insumos</li>
                  <li>Entrada e saída visíveis</li>
                  <li>Consumo baseado em venda</li>
                </ul>
              </div>

              <div className="bento-card bento-large" data-aos="fade-up" data-aos-delay="400">
                <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ marginBottom: "16px", color: "#DDAA00" }}>
                      <i data-lucide="bar-chart-2" data-size="24"></i>
                    </div>
                    <h3>Relatórios que Dão Direção</h3>
                    <p>
                      Nada de gráfico inútil. Relatório aqui não é burocracia, é base para decisão (vendas
                      reais, rentabilidade).
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ marginBottom: "16px", color: "#1EBD60" }}>
                      <i data-lucide="dollar-sign" data-size="24"></i>
                    </div>
                    <h3>Financeiro Simplificado</h3>
                    <p>
                      O dono para de perguntar "Será que logo lucro?" e passa a saber com organização e
                      leitura clara de resultados.
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ marginBottom: "16px", color: "#A09E9C" }}>
                      <i data-lucide="palette" data-size="24"></i>
                    </div>
                    <h3>Templates e Marca</h3>
                    <p>
                      Você não entrega só sistema, entrega presença com identidades e templates
                      personalizados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Prova Social */}
        <section>
          <div className="lp-container">
            <div className="section-title" data-aos="fade-up">
              <h2>Validação Real</h2>
              <p>Resultados comuns entre restaurantes que eliminam desperdício com controle.</p>
            </div>
            <div className="testimonial-grid">
              <div className="t-card" data-aos="fade-up" data-aos-delay="100">
                <p className="quote">"O problema não era vender pouco. Era perder muito sem perceber."</p>
                <p className="result">Redução de 20% a 30% em perdas</p>
              </div>
              <div className="t-card" style={{ backgroundColor: "#12100F" }} data-aos="fade-up" data-aos-delay="200">
                <p className="quote">
                  O valor salvo em desperdício cobre amplamente o valor do software logo no início.
                </p>
                <p className="result">Economia supera o custo gerado</p>
              </div>
              <div className="t-card" data-aos="fade-up" data-aos-delay="300">
                <p className="quote">
                  Sem as dores de cabeça habituais no fechamento do caixa e inventário da despensa.
                </p>
                <p className="result">Operação mais previsível</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Oferta */}
        <section id="oferta" className="offer-section">
          <div className="lp-container">
            <div className="offer-box" data-aos="zoom-in" data-aos-duration="1000">
              <h2 style={{ fontSize: "2.4rem", marginBottom: "16px" }}>
                Quanto custa não controlar o estoque?
              </h2>
              <div
                style={{
                  margin: "32px 0",
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "1.1rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>
                  <i data-lucide="x-circle" data-size="18" style={{ color: "var(--danger)" }}></i> Um insumo
                  vencido...
                </span>
                <span>
                  <i data-lucide="x-circle" data-size="18" style={{ color: "var(--danger)" }}></i> Um erro de
                  porcionamento...
                </span>
                <span>
                  <i data-lucide="x-circle" data-size="18" style={{ color: "var(--danger)" }}></i> Uma semana sem
                  visibilidade...
                </span>
              </div>
              <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff", marginBottom: "48px" }}>
                Tudo isso custa mais do que o Cheffnex.
              </p>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  padding: "24px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--border-color)",
                  marginBottom: "40px",
                }}
              >
                <h4 style={{ color: "var(--success)", fontSize: "1.2rem", marginBottom: "8px" }}>
                  Teste sem risco (7 Dias)
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Use o Cheffnex por 7 dias no seu restaurante. Se você não enxergar onde está perdendo
                  dinheiro, cancele com 1 clique.
                </p>
              </div>
              <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: "100%", fontSize: "1.2rem", padding: "20px" }}
              >
                👉 Quero eliminar o desperdício
              </a>
            </div>
          </div>
        </section>

        {/* 9. FAQ */}
        <section>
          <div className="lp-container">
            <div className="section-title">
              <h2>Destruição de Objeções</h2>
            </div>
            <div className="faq-list">
              <div className="faq-item" data-aos="fade-up" data-aos-delay="100">
                <strong>Preciso mudar toda minha operação?</strong>
                <p>Não. O Cheffnex se adapta ao fluxo que você já usa.</p>
              </div>
              <div className="faq-item" data-aos="fade-up" data-aos-delay="150">
                <strong>Minha equipe vai conseguir usar?</strong>
                <p>Sim. O sistema foi feito para funcionar no meio do rush.</p>
              </div>
              <div className="faq-item" data-aos="fade-up" data-aos-delay="200">
                <strong>Vocês ajudam na configuração?</strong>
                <p>Sim. Cardápio e estrutura inicial têm suporte total.</p>
              </div>
              <div className="faq-item" data-aos="fade-up" data-aos-delay="250">
                <strong>Funciona para restaurante pequeno?</strong>
                <p>Principalmente. Onde a margem é curta, o desperdício dói mais.</p>
              </div>
              <div className="faq-item" data-aos="fade-up" data-aos-delay="300">
                <strong>É só controle de estoque?</strong>
                <p>Não. Estoque é o começo. O controle se estende a pedidos, vendas e financeiro.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Footer */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="footer-grid">
              <div className="f-col">
                <div className="logo-icon" style={{ marginBottom: "8px" }}>
                  <i data-lucide="chef-hat" color="white" data-size="20"></i>
                </div>
                <h2 className="font-outfit" style={{ fontSize: "1.5rem", color: "#fff" }}>
                  Cheffnex
                </h2>
                <span style={{ maxWidth: "300px" }}>
                  Transformando desperdício invisível em controle real.
                </span>
              </div>
              <div className="f-col" style={{ textAlign: "right" }}>
                <strong>Contato</strong>
                <span>suporte@cheffnex.com.br</span>
                <span>Praça Central, S/N - São Paulo/SP</span>
                <span>CNPJ: 00.000.000/0001-00</span>
              </div>
            </div>
            <div className="f-bottom">
              <span>© 2026 Cheffnex. Todos os direitos reservados.</span>
              <div style={{ display: "flex", gap: "24px" }}>
                <a href="#" style={{ color: "#555", textDecoration: "none" }}>
                  Termos de uso
                </a>
                <a href="#" style={{ color: "#555", textDecoration: "none" }}>
                  Política de privacidade
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
