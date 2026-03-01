import React from "react";
import {
  ClipboardList,
  Factory,
  FileText,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./HowItWorks.css";

const steps = [
  {
    icon: <ClipboardList size={24} />,
    step: 1,
    title: "Enter Order",
    desc: "Log customer orders with details — quantity, specs, deadline.",
  },
  {
    icon: <Factory size={24} />,
    step: 2,
    title: "Track Production",
    desc: "Monitor daily output, defects, and worker progress in real time.",
  },
  {
    icon: <FileText size={24} />,
    step: 3,
    title: "Generate Invoice",
    desc: "Auto-generate GST-compliant PDF invoices with one click.",
  },
  {
    icon: <CreditCard size={24} />,
    step: 4,
    title: "Record Payment",
    desc: "Track partial payments, dues, and send automated reminders.",
  },
  {
    icon: <LayoutDashboard size={24} />,
    step: 5,
    title: "Monitor Dashboard",
    desc: "Real-time analytics on revenue, orders, and factory performance.",
  },
];

export default function HowItWorks() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="how-it-works" className="section how-it-works">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 56 }}>
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">
              5 Simple Steps to Streamline Your Factory
            </h2>
            <p className="section-subtitle mx-auto">
              From order entry to analytics — everything flows seamlessly.
            </p>
          </div>

          <div className="hiw__timeline">
            {steps.map((s, i) => (
              <div className="hiw__step" key={i}>
                <div className="hiw__step-marker">
                  <div className="hiw__step-icon">{s.icon}</div>
                  <span className="hiw__step-number">Step {s.step}</span>
                  {i < steps.length - 1 && <div className="hiw__step-line" />}
                </div>
                <div className="hiw__step-content">
                  <h3 className="hiw__step-title">{s.title}</h3>
                  <p className="hiw__step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
