import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Pricing.css";

const setupIncludes = [
  "Custom module configuration",
  "On-site / remote training",
  "Cloud deployment & setup",
  "Existing data migration",
  "WhatsApp integration setup",
];

const monthlyIncludes = [
  "System maintenance & updates",
  "Daily cloud backup",
  "WhatsApp reminder credits",
  "Priority technical support",
  "New feature access",
];

export default function Pricing() {
  const [ref, isVisible] = useScrollAnimation();

  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Pricing</span>
            <h2 className="section-title">
              Transparent, Factory-Friendly Pricing
            </h2>
            <p className="section-subtitle mx-auto">
              No hidden fees. No per-user charges. One system for your entire
              factory.
            </p>
          </div>

          <div className="pricing__cards">
            {/* Setup Fee */}
            <div className="pricing__card">
              <div className="pricing__card-badge">One-Time</div>
              <h3 className="pricing__card-title">Setup & Deployment</h3>
              <div className="pricing__price">
                <span className="pricing__currency">₹</span>
                <span className="pricing__amount">25,000</span>
                <span className="pricing__range"> – ₹40,000</span>
              </div>
              <p className="pricing__note">
                Based on factory size & customization needs
              </p>
              <ul className="pricing__list">
                {setupIncludes.map((item, i) => (
                  <li key={i}>
                    <Check size={16} className="pricing__check" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly Fee */}
            <div className="pricing__card pricing__card--featured">
              <div className="pricing__card-badge pricing__card-badge--accent">
                Recommended
              </div>
              <h3 className="pricing__card-title">Monthly Support</h3>
              <div className="pricing__price">
                <span className="pricing__currency">₹</span>
                <span className="pricing__amount">3,000</span>
                <span className="pricing__range"> – ₹5,000</span>
                <span className="pricing__period">/month</span>
              </div>
              <p className="pricing__note">
                Everything to keep your system running smooth
              </p>
              <ul className="pricing__list">
                {monthlyIncludes.map((item, i) => (
                  <li key={i}>
                    <Check size={16} className="pricing__check" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 24 }}
                onClick={scrollToContact}
              >
                Schedule Demo <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="pricing__guarantee">
            <span>🛡️</span>
            <p>
              <strong>Satisfaction Guarantee:</strong> If FactoryFlow doesn't
              improve your operations within 30 days, we'll work with you until
              it does — at no extra cost.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
