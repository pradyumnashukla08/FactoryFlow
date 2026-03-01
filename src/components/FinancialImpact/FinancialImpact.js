import React from "react";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./FinancialImpact.css";

const beforeItems = [
  { label: "Invoice Generation", value: "2-3 hours", bad: true },
  { label: "Payment Tracking", value: "Manual / No system", bad: true },
  { label: "Order Visibility", value: "WhatsApp threads", bad: true },
  { label: "Cash Flow Delays", value: "₹25,000+/month", bad: true },
  { label: "GST Compliance", value: "Error-prone", bad: true },
];

const afterItems = [
  { label: "Invoice Generation", value: "2 minutes", good: true },
  { label: "Payment Tracking", value: "Automated alerts", good: true },
  { label: "Order Visibility", value: "Real-time dashboard", good: true },
  { label: "Cash Flow Delays", value: "₹0 blocked", good: true },
  { label: "GST Compliance", value: "100% accurate", good: true },
];

export default function FinancialImpact() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="financial-impact" className="section financial-impact">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Financial Impact</span>
            <h2 className="section-title">
              See the Difference FactoryFlow Makes
            </h2>
            <p className="section-subtitle mx-auto">
              A factory billing ₹5,00,000/month can recover ₹25,000+ in blocked
              working capital.
            </p>
          </div>

          {/* Chart visualization */}
          <div className="fi__chart-wrapper">
            <div className="fi__chart">
              <div className="fi__chart-header">
                <h4>Monthly Revenue Recovery Potential</h4>
              </div>
              <div className="fi__chart-bars">
                <div className="fi__chart-group">
                  <span className="fi__chart-label">
                    Working Capital Blocked
                  </span>
                  <div className="fi__chart-bar-row">
                    <div
                      className="fi__chart-bar fi__chart-bar--before"
                      style={{ width: "80%" }}
                    >
                      <span>₹25,000</span>
                    </div>
                  </div>
                  <div className="fi__chart-bar-row">
                    <div
                      className="fi__chart-bar fi__chart-bar--after"
                      style={{ width: "10%" }}
                    >
                      <span>₹0</span>
                    </div>
                  </div>
                </div>
                <div className="fi__chart-group">
                  <span className="fi__chart-label">
                    Invoice Processing Time
                  </span>
                  <div className="fi__chart-bar-row">
                    <div
                      className="fi__chart-bar fi__chart-bar--before"
                      style={{ width: "90%" }}
                    >
                      <span>3 hrs</span>
                    </div>
                  </div>
                  <div className="fi__chart-bar-row">
                    <div
                      className="fi__chart-bar fi__chart-bar--after"
                      style={{ width: "8%" }}
                    >
                      <span>2 min</span>
                    </div>
                  </div>
                </div>
                <div className="fi__chart-group">
                  <span className="fi__chart-label">
                    Payment Collection Rate
                  </span>
                  <div className="fi__chart-bar-row">
                    <div
                      className="fi__chart-bar fi__chart-bar--before"
                      style={{ width: "55%" }}
                    >
                      <span>65%</span>
                    </div>
                  </div>
                  <div className="fi__chart-bar-row">
                    <div
                      className="fi__chart-bar fi__chart-bar--after"
                      style={{ width: "85%" }}
                    >
                      <span>95%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="fi__chart-legend">
                <span className="fi__legend-item">
                  <span className="fi__legend-dot fi__legend-dot--before" />{" "}
                  Before FactoryFlow
                </span>
                <span className="fi__legend-item">
                  <span className="fi__legend-dot fi__legend-dot--after" />{" "}
                  After FactoryFlow
                </span>
              </div>
            </div>
          </div>

          {/* Comparison cards */}
          <div className="fi__comparison">
            <div className="fi__card fi__card--before">
              <div className="fi__card-header">
                <TrendingDown size={24} />
                <h3>Before FactoryFlow</h3>
              </div>
              <div className="fi__card-items">
                {beforeItems.map((item, i) => (
                  <div className="fi__card-row" key={i}>
                    <span className="fi__card-label">{item.label}</span>
                    <span className="fi__card-value fi__card-value--bad">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fi__arrow">
              <ArrowRight size={32} />
            </div>

            <div className="fi__card fi__card--after">
              <div className="fi__card-header fi__card-header--after">
                <TrendingUp size={24} />
                <h3>After FactoryFlow</h3>
              </div>
              <div className="fi__card-items">
                {afterItems.map((item, i) => (
                  <div className="fi__card-row" key={i}>
                    <span className="fi__card-label">{item.label}</span>
                    <span className="fi__card-value fi__card-value--good">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
