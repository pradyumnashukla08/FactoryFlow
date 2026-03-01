import React from "react";
import { CheckCircle, Monitor, Users } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Solution.css";

const highlights = [
  {
    icon: <Monitor size={20} />,
    title: "Simple Interface",
    desc: "No training needed — built for factory owners, not IT teams.",
  },
  {
    icon: <Users size={20} />,
    title: "Designed for Factories",
    desc: "Purpose-built for garments, plastics, furniture & engineering workshops.",
  },
  {
    icon: <CheckCircle size={20} />,
    title: "No IT Team Required",
    desc: "Get started in 2 days with guided setup and onboarding.",
  },
];

export default function Solution() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="solution" className="section solution">
      <div className="container">
        <div
          className={`solution__inner ${isVisible ? "animate-fade-in-up" : ""}`}
          ref={ref}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <span className="section-tag">The Solution</span>
          <h2 className="section-title">
            Introducing{" "}
            <span style={{ color: "var(--accent)" }}>FactoryFlow</span>
          </h2>
          <p className="section-subtitle">
            A centralized web-based system that simplifies order tracking,
            production monitoring, and billing for small and mid-sized
            factories.
          </p>

          <div className="solution__highlights">
            {highlights.map((item, i) => (
              <div className="solution__card" key={i}>
                <span className="solution__card-icon">{item.icon}</span>
                <h4 className="solution__card-title">{item.title}</h4>
                <p className="solution__card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
