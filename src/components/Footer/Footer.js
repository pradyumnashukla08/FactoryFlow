import React from "react";
import "./Footer.css";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Roadmap", href: "#roadmap" },
  ],
  Company: [
    { label: "About", href: "#hero" },
    { label: "Contact", href: "#contact" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  Industries: [
    { label: "Garment Manufacturing", href: "#features" },
    { label: "Plastic Molding", href: "#features" },
    { label: "Furniture", href: "#features" },
    { label: "Engineering Workshops", href: "#features" },
  ],
};

export default function Footer() {
  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <a
              href="#hero"
              className="footer__logo"
              onClick={(e) => scrollTo(e, "#hero")}
            >
              <span className="footer__logo-icon">⚙</span>
              Factory<span className="footer__logo-accent">Flow</span>
            </a>
            <p className="footer__desc">
              Smart Order & Billing Management System designed for Indian
              manufacturing factories. Simplify operations, increase profits.
            </p>
            <div className="footer__contact-info">
              <p>📞 +91 92248 20095</p>
              <p>✉️ pradyumnashukla08@gmail.com</p>
              <p>📍 Mumbai, Maharashtra, India</p>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div className="footer__col" key={title}>
              <h4 className="footer__col-title">{title}</h4>
              <ul>
                {links.map((link, i) => (
                  <li key={i}>
                    <a href={link.href} onClick={(e) => scrollTo(e, link.href)}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} FactoryFlow. All rights reserved.</p>
          <p>Made with ❤️ for Indian Manufacturing</p>
        </div>
      </div>
    </footer>
  );
}
