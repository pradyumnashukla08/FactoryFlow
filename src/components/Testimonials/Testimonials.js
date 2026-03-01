import React from "react";
import { Star } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import "./Testimonials.css";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, Kumar Plastics",
    city: "Rajkot, Gujarat",
    text: "Before FactoryFlow, we spent 3 hours daily on invoicing alone. Now it takes minutes. Our payment collection improved by 40% in the first month.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "MD, Sharma Garments",
    city: "Ludhiana, Punjab",
    text: "The WhatsApp reminders are a game-changer. Our overdue payments dropped significantly. Simple system that my floor managers actually use.",
    rating: 5,
  },
  {
    name: "Anil Mehta",
    role: "Partner, Mehta Engineering Works",
    city: "Pune, Maharashtra",
    text: "We tried an ERP before — complete waste of money. FactoryFlow understood our factory floor. Setup was done in 3 days, and we were running smoothly within a week.",
    rating: 5,
  },
];

export default function Testimonials() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section id="testimonials" className="section testimonials">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">Built for Growing Factories</h2>
            <p className="section-subtitle mx-auto">
              Hear from factory owners who transformed their operations with
              FactoryFlow.
            </p>
          </div>

          <div className="testimonials__grid">
            {testimonials.map((t, i) => (
              <div className="testimonials__card" key={i}>
                <div className="testimonials__stars">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
                <p className="testimonials__text">"{t.text}"</p>
                <div className="testimonials__author">
                  <div className="testimonials__avatar">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="testimonials__name">{t.name}</h4>
                    <p className="testimonials__role">{t.role}</p>
                    <p className="testimonials__city">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="testimonials__note text-center">
            * Testimonial placeholders — to be replaced with real customer
            stories.
          </p>
        </div>
      </div>
    </section>
  );
}
