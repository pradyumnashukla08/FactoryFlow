import React from "react";
import { AlertTriangle, MessageSquare, FileX, Clock, Eye } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Problem.css";

const problems = [
  {
    icon: <MessageSquare size={22} />,
    text: "Orders managed on WhatsApp & paper",
  },
  { icon: <FileX size={22} />, text: "No centralized order tracking" },
  { icon: <Clock size={22} />, text: "Payment delays affecting cash flow" },
  { icon: <AlertTriangle size={22} />, text: "Manual GST invoice generation" },
  { icon: <Eye size={22} />, text: "No real-time production visibility" },
];

export default function Problem() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="problem" className="section problem">
      <div className="container">
        <div
          className={`problem__content ${isVisible ? "animate-fade-in-up" : ""}`}
          ref={ref}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="problem__header text-center">
            <span className="section-tag">The Problem</span>
            <h2 className="section-title">
              Factory Operations Should Not Be Chaotic
            </h2>
            <p className="section-subtitle mx-auto">
              Most small and mid-sized factories still run on paper registers,
              WhatsApp groups, and manual ledgers — leading to costly
              operational gaps.
            </p>
          </div>

          <div className="problem__grid">
            <div className="problem__list">
              {problems.map((item, i) => (
                <div
                  className="problem__item"
                  key={i}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="problem__icon">{item.icon}</span>
                  <span className="problem__text">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="problem__impact">
              <div className="problem__impact-card">
                <span className="problem__impact-tag">💰 Financial Impact</span>
                <h3 className="problem__impact-title">Hidden Cost of Delays</h3>
                <div className="problem__impact-calc">
                  <div className="problem__calc-row">
                    <span>Monthly Billing</span>
                    <span className="problem__calc-value">₹5,00,000</span>
                  </div>
                  <div className="problem__calc-row">
                    <span>Average Delay</span>
                    <span className="problem__calc-value">5%</span>
                  </div>
                  <div className="problem__calc-divider" />
                  <div className="problem__calc-row problem__calc-row--result">
                    <span>Working Capital Blocked</span>
                    <span className="problem__calc-value problem__calc-value--accent">
                      ₹25,000
                    </span>
                  </div>
                </div>
                <p className="problem__impact-note">
                  Every month, delayed payments and untracked orders silently
                  drain your profits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
