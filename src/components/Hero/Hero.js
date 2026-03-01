import React from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import "./Hero.css";

export default function Hero() {
  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="hero">
      <div className="hero__bg">
        <div className="hero__grid-pattern" />
        <div className="hero__gradient" />
      </div>

      <div className="container hero__content">
        <div className="hero__text">
          <span className="hero__badge">🏭 Built for Indian Manufacturing</span>
          <h1 className="hero__title">
            Control Production.
            <br />
            Track Payments.
            <br />
            <span className="hero__title-accent">Increase Profit.</span>
          </h1>
          <p className="hero__subtitle">
            Smart Order &amp; Billing Management System for Indian Manufacturing
            Factories. Replace WhatsApp chaos with a centralized dashboard.
          </p>
          <div className="hero__actions">
            <button
              className="btn btn-primary btn-large"
              onClick={() => scrollTo("#contact")}
            >
              Book Free Demo <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={() => scrollTo("#how-it-works")}
            >
              <PlayCircle size={18} /> See How It Works
            </button>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">5x</span>
              <span className="hero__stat-label">Faster Invoicing</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">₹25K+</span>
              <span className="hero__stat-label">Monthly Savings</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">100%</span>
              <span className="hero__stat-label">GST Compliant</span>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__dashboard">
            <div className="hero__dashboard-header">
              <div className="hero__dashboard-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="hero__dashboard-title">
                FactoryFlow Dashboard
              </span>
            </div>
            <div className="hero__dashboard-body">
              <div className="hero__dashboard-row">
                <div className="hero__metric-card">
                  <span className="hero__metric-label">Today's Revenue</span>
                  <span className="hero__metric-value">₹1,42,500</span>
                  <span className="hero__metric-change hero__metric-change--up">
                    ↑ 12%
                  </span>
                </div>
                <div className="hero__metric-card">
                  <span className="hero__metric-label">Pending Orders</span>
                  <span className="hero__metric-value">23</span>
                  <span className="hero__metric-change hero__metric-change--neutral">
                    Active
                  </span>
                </div>
              </div>
              <div className="hero__dashboard-row">
                <div className="hero__metric-card hero__metric-card--wide">
                  <span className="hero__metric-label">Production Status</span>
                  <div className="hero__progress-bar">
                    <div
                      className="hero__progress-fill"
                      style={{ width: "72%" }}
                    />
                  </div>
                  <span className="hero__metric-sub">
                    72% — 18 of 25 units completed
                  </span>
                </div>
              </div>
              <div className="hero__dashboard-row">
                <div className="hero__metric-card">
                  <span className="hero__metric-label">Payments Due</span>
                  <span className="hero__metric-value hero__metric-value--warn">
                    ₹3,20,000
                  </span>
                </div>
                <div className="hero__metric-card">
                  <span className="hero__metric-label">GST Invoices</span>
                  <span className="hero__metric-value">47</span>
                  <span className="hero__metric-change hero__metric-change--up">
                    This month
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
