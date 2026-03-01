import React, { useState } from "react";
import { Send, Phone, Mail, MapPin, Loader } from "lucide-react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import api from "../../services/api";
import "./Contact.css";

const billingRanges = [
  "Below ₹1,00,000",
  "₹1,00,000 – ₹5,00,000",
  "₹5,00,000 – ₹15,00,000",
  "₹15,00,000 – ₹50,00,000",
  "Above ₹50,00,000",
];

const initialFormState = {
  name: "",
  factoryName: "",
  phone: "",
  email: "",
  city: "",
  billingRange: "",
  message: "",
};

export default function Contact() {
  const [ref, isVisible] = useScrollAnimation();
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.factoryName.trim()) errs.factoryName = "Factory name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.billingRange) errs.billingRange = "Please select a billing range";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      await api.submitDemoRequest({
        name: form.name.trim(),
        factory_name: form.factoryName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        billing_range: form.billingRange,
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm(initialFormState);
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <div
          ref={ref}
          className={isVisible ? "animate-fade-in-up" : ""}
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="contact__grid">
            <div className="contact__info">
              <span className="section-tag">Get Started</span>
              <h2 className="section-title">Book Your Free Demo</h2>
              <p className="section-subtitle">
                See how FactoryFlow can transform your factory operations. Fill
                in the form and our team will reach out within 24 hours.
              </p>

              <div className="contact__details">
                <div className="contact__detail">
                  <Phone size={20} />
                  <div>
                    <h4>Phone</h4>
                    <p>+91 92248 20095</p>
                  </div>
                </div>
                <div className="contact__detail">
                  <Mail size={20} />
                  <div>
                    <h4>Email</h4>
                    <p>pradyumnashukla08@gmail.com</p>
                  </div>
                </div>
                <div className="contact__detail">
                  <MapPin size={20} />
                  <div>
                    <h4>Location</h4>
                    <p>Mumbai, Maharashtra, India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact__form-wrapper">
              {submitted ? (
                <div className="contact__success">
                  <div className="contact__success-icon">✓</div>
                  <h3>Demo Request Submitted!</h3>
                  <p>
                    Thank you for your interest. Our team will contact you
                    within 24 hours to schedule your personalized demo.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setSubmitted(false)}
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form
                  className="contact__form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="contact__form-row">
                    <div className="contact__field">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={errors.name ? "contact__input--error" : ""}
                      />
                      {errors.name && (
                        <span className="contact__error">{errors.name}</span>
                      )}
                    </div>
                    <div className="contact__field">
                      <label htmlFor="factoryName">Factory Name *</label>
                      <input
                        type="text"
                        id="factoryName"
                        name="factoryName"
                        value={form.factoryName}
                        onChange={handleChange}
                        placeholder="e.g., Kumar Plastics"
                        className={
                          errors.factoryName ? "contact__input--error" : ""
                        }
                      />
                      {errors.factoryName && (
                        <span className="contact__error">
                          {errors.factoryName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="contact__form-row">
                    <div className="contact__field">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        className={errors.phone ? "contact__input--error" : ""}
                      />
                      {errors.phone && (
                        <span className="contact__error">{errors.phone}</span>
                      )}
                    </div>
                    <div className="contact__field">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        className={errors.email ? "contact__input--error" : ""}
                      />
                      {errors.email && (
                        <span className="contact__error">{errors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="contact__form-row">
                    <div className="contact__field">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="e.g., Pune"
                        className={errors.city ? "contact__input--error" : ""}
                      />
                      {errors.city && (
                        <span className="contact__error">{errors.city}</span>
                      )}
                    </div>
                    <div className="contact__field">
                      <label htmlFor="billingRange">
                        Monthly Billing Range *
                      </label>
                      <select
                        id="billingRange"
                        name="billingRange"
                        value={form.billingRange}
                        onChange={handleChange}
                        className={
                          errors.billingRange ? "contact__input--error" : ""
                        }
                      >
                        <option value="">Select range</option>
                        {billingRanges.map((r, i) => (
                          <option key={i} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {errors.billingRange && (
                        <span className="contact__error">
                          {errors.billingRange}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="contact__field">
                    <label htmlFor="message">Message (Optional)</label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your factory and requirements..."
                      rows={4}
                    />
                  </div>

                  {apiError && (
                    <div className="contact__api-error">{apiError}</div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    style={{ width: "100%" }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader size={18} className="spinning" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Book Free Demo
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
