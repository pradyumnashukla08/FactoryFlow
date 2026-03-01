import React from "react";
import { Check, X } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Competitive.css";

const comparisons = [
  { feature: "Price", erp: "₹2-10 Lakh+", ff: "₹25K-40K setup" },
  { feature: "Setup Time", erp: "3-6 months", ff: "2-5 days" },
  { feature: "Complexity", erp: "Steep learning curve", ff: "Owner-friendly" },
  {
    feature: "IT Team Required",
    erp: "Yes",
    ff: "No",
    erpBad: true,
    ffGood: true,
  },
  {
    feature: "Indian MSME Focus",
    erp: "Generic",
    ff: "Purpose-built",
    ffGood: true,
  },
  {
    feature: "WhatsApp Integration",
    erp: "Usually not",
    ff: "Built-in",
    erpBad: true,
    ffGood: true,
  },
  {
    feature: "GST Compliance",
    erp: "Add-on module",
    ff: "Core feature",
    ffGood: true,
  },
  { feature: "Monthly Cost", erp: "₹10K-50K+", ff: "₹3K-5K" },
];

export default function Competitive() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="competitive" className="section competitive">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Why FactoryFlow</span>
            <h2 className="section-title">FactoryFlow vs Traditional ERP</h2>
            <p className="section-subtitle mx-auto">
              Big ERPs are built for big companies. FactoryFlow is built for
              Indian manufacturing floors.
            </p>
          </div>

          <div className="comp__table-wrapper">
            <table className="comp__table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="comp__th-erp">Traditional ERP</th>
                  <th className="comp__th-ff">FactoryFlow ⚙</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={i}>
                    <td className="comp__feature">{row.feature}</td>
                    <td className="comp__erp-cell">
                      {row.erpBad && <X size={16} className="comp__icon-bad" />}
                      {row.erp}
                    </td>
                    <td className="comp__ff-cell">
                      {row.ffGood && (
                        <Check size={16} className="comp__icon-good" />
                      )}
                      {row.ff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
