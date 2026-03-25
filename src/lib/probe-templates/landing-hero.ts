import { ProbeDesignTokens } from '../types';

export function buildLandingHeroHtml(tokens: ProbeDesignTokens): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: ${tokens.fontFamily};
    font-size: ${tokens.fontSizeBase};
    line-height: ${tokens.lineHeight};
    letter-spacing: ${tokens.letterSpacing};
    color: ${tokens.colorText};
    background: ${tokens.colorBg};
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px ${tokens.sectionPadding};
    border-bottom: ${tokens.borderWidth} solid ${tokens.colorBorder};
  }

  .nav-brand {
    font-size: ${tokens.fontSizeH2};
    font-weight: ${tokens.fontWeightHeading};
    color: ${tokens.colorText};
  }

  .nav-links {
    display: flex;
    gap: 24px;
    list-style: none;
  }

  .nav-links a {
    color: ${tokens.colorTextSecondary};
    text-decoration: none;
    font-size: ${tokens.fontSizeSmall};
  }

  .hero {
    max-width: ${tokens.containerMaxWidth};
    margin: 0 auto;
    padding: ${tokens.sectionPadding};
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${tokens.gridGap};
    align-items: center;
    min-height: 60vh;
  }

  .hero h1 {
    font-size: ${tokens.fontSizeH1};
    font-weight: ${tokens.fontWeightHeading};
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 20px;
  }

  .hero p {
    color: ${tokens.colorTextSecondary};
    font-size: ${tokens.fontSizeBase};
    margin-bottom: 32px;
    max-width: 480px;
  }

  .btn-primary {
    display: inline-block;
    padding: 12px 28px;
    background: ${tokens.colorAccent};
    color: white;
    border: none;
    border-radius: ${tokens.borderRadius};
    font-size: ${tokens.fontSizeBase};
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
  }

  .btn-secondary {
    display: inline-block;
    padding: 12px 28px;
    background: transparent;
    color: ${tokens.colorText};
    border: ${tokens.borderWidth} solid ${tokens.colorBorder};
    border-radius: ${tokens.borderRadius};
    font-size: ${tokens.fontSizeBase};
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    margin-left: 12px;
  }

  .hero-visual {
    background: ${tokens.colorSurface};
    border: ${tokens.borderWidth} solid ${tokens.colorBorder};
    border-radius: ${tokens.borderRadius};
    aspect-ratio: 4/3;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${tokens.shadowMedium};
  }

  .hero-visual-placeholder {
    color: ${tokens.colorTextSecondary};
    font-size: ${tokens.fontSizeSmall};
  }

  .features {
    max-width: ${tokens.containerMaxWidth};
    margin: 0 auto;
    padding: 0 ${tokens.sectionPadding} ${tokens.sectionPadding};
  }

  .features h2 {
    font-size: ${tokens.fontSizeH2};
    font-weight: ${tokens.fontWeightHeading};
    margin-bottom: 40px;
    text-align: center;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(${tokens.gridColumns}, 1fr);
    gap: ${tokens.gridGap};
  }

  .feature-card {
    background: ${tokens.colorSurface};
    border: ${tokens.borderWidth} solid ${tokens.colorBorder};
    border-radius: ${tokens.borderRadius};
    padding: 24px;
    box-shadow: ${tokens.shadowSmall};
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    background: ${tokens.colorAccent}20;
    border-radius: ${tokens.borderRadius};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    color: ${tokens.colorAccent};
    font-size: 18px;
  }

  .feature-card h3 {
    font-size: ${tokens.fontSizeBase};
    font-weight: ${tokens.fontWeightHeading};
    margin-bottom: 8px;
  }

  .feature-card p {
    color: ${tokens.colorTextSecondary};
    font-size: ${tokens.fontSizeSmall};
  }
</style>
</head>
<body>
  <nav class="nav">
    <div class="nav-brand">Acme</div>
    <ul class="nav-links">
      <li><a href="#">Features</a></li>
      <li><a href="#">Pricing</a></li>
      <li><a href="#">Docs</a></li>
      <li><a href="#">Blog</a></li>
    </ul>
  </nav>

  <section class="hero">
    <div>
      <h1>Build better products, faster</h1>
      <p>The modern platform for teams who ship. Powerful workflows, beautiful interfaces, and the tools you need to move fast.</p>
      <div>
        <a href="#" class="btn-primary">Get Started</a>
        <a href="#" class="btn-secondary">Learn More</a>
      </div>
    </div>
    <div class="hero-visual">
      <span class="hero-visual-placeholder">Product Screenshot</span>
    </div>
  </section>

  <section class="features">
    <h2>Everything you need</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>Sub-second response times with globally distributed infrastructure and smart caching.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Secure by Default</h3>
        <p>Enterprise-grade security with SOC 2 compliance and end-to-end encryption.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Deep Analytics</h3>
        <p>Real-time insights into your product usage, performance, and user behavior.</p>
      </div>
    </div>
  </section>
</body>
</html>`;
}
