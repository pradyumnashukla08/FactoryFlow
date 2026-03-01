import React from "react";
import { Package, Users as UsersIcon, Boxes, Brain } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Roadmap.css";

const upcoming = [
  {
    icon: <Package size={24} />,
    title: "Inventory Tracking",
    desc: "Track raw materials and finished goods across warehouses.",
    quarter: "Q2 2026",
  },
  {
    icon: <UsersIcon size={24} />,
    title: "Worker Attendance",
    desc: "Biometric-free attendance system with shift management.",
    quarter: "Q3 2026",
  },
  {
    icon: <Boxes size={24} />,
    title: "Raw Material Planning",
    desc: "Auto-plan material requirements based on order pipeline.",
    quarter: "Q3 2026",
  },
  {
    icon: <Brain size={24} />,
    title: "AI Demand Forecasting",
    desc: "Predict order volumes using historical patterns and trends.",
    quarter: "Q4 2026",
  },
];

export default function Roadmap() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="roadmap" className="section roadmap">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Roadmap</span>
            <h2 className="section-title">What's Coming Next</h2>
            <p className="section-subtitle mx-auto">
              We're continuously building features that Indian manufacturers
              actually need.
            </p>
          </div>

          <div className="roadmap__grid">
            {upcoming.map((item, i) => (
              <div className="roadmap__card" key={i}>
                <div className="roadmap__card-top">
                  <span className="roadmap__card-icon">{item.icon}</span>
                  <span className="roadmap__quarter">{item.quarter}</span>
                </div>
                <h3 className="roadmap__card-title">{item.title}</h3>
                <p className="roadmap__card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
