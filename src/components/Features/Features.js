import React from "react";
import {
  Users,
  ClipboardList,
  Factory,
  FileText,
  CreditCard,
  Bell,
  LayoutDashboard,
} from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Features.css";

const features = [
  {
    icon: <Users size={28} />,
    title: "Customer Management",
    points: [
      "Complete order history",
      "Outstanding balance tracking",
      "Customer-wise analytics",
    ],
  },
  {
    icon: <ClipboardList size={28} />,
    title: "Order Tracking",
    points: [
      "Real-time status updates",
      "Delivery timeline visibility",
      "Priority management",
    ],
  },
  {
    icon: <Factory size={28} />,
    title: "Production Monitoring",
    points: [
      "Daily output tracking",
      "Defect rate analysis",
      "Worker productivity insights",
    ],
  },
  {
    icon: <FileText size={28} />,
    title: "GST Billing",
    points: [
      "Auto tax calculation",
      "Professional PDF invoices",
      "GSTIN validation",
    ],
  },
  {
    icon: <CreditCard size={28} />,
    title: "Payment Tracking",
    points: [
      "Partial payment recording",
      "Due date alerts",
      "Payment history logs",
    ],
  },
  {
    icon: <Bell size={28} />,
    title: "Automated Reminders",
    points: [
      "WhatsApp integration",
      "Payment due notifications",
      "Order status alerts",
    ],
  },
  {
    icon: <LayoutDashboard size={28} />,
    title: "Owner Dashboard",
    points: [
      "Revenue analytics",
      "Pending payment overview",
      "Performance metrics",
    ],
  },
];

export default function Features() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="features" className="section features">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything Your Factory Needs</h2>
            <p className="section-subtitle mx-auto">
              Seven powerful modules designed specifically for manufacturing
              operations.
            </p>
          </div>

          <div className="features__grid">
            {features.map((feat, i) => (
              <div className="features__card" key={i}>
                <span className="features__card-icon">{feat.icon}</span>
                <h3 className="features__card-title">{feat.title}</h3>
                <ul className="features__card-list">
                  {feat.points.map((p, j) => (
                    <li key={j}>
                      <span className="features__check">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
