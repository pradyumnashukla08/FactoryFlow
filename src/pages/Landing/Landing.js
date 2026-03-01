import React, { lazy, Suspense } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";

const Problem = lazy(() => import("../../components/Problem/Problem"));
const Solution = lazy(() => import("../../components/Solution/Solution"));
const Features = lazy(() => import("../../components/Features/Features"));
const HowItWorks = lazy(() => import("../../components/HowItWorks/HowItWorks"));
const FinancialImpact = lazy(() => import("../../components/FinancialImpact/FinancialImpact"));
const Pricing = lazy(() => import("../../components/Pricing/Pricing"));
const Competitive = lazy(() => import("../../components/Competitive/Competitive"));
const Roadmap = lazy(() => import("../../components/Roadmap/Roadmap"));
const Testimonials = lazy(() => import("../../components/Testimonials/Testimonials"));
const Contact = lazy(() => import("../../components/Contact/Contact"));
const Footer = lazy(() => import("../../components/Footer/Footer"));

const Landing = () => {
  return (
    <div className="App">
      <Navbar />
      <Hero />
      <Suspense fallback={<div className="section-loader" />}>
        <Problem />
        <Solution />
        <Features />
        <HowItWorks />
        <FinancialImpact />
        <Pricing />
        <Competitive />
        <Roadmap />
        <Testimonials />
        <Contact />
        <Footer />
      </Suspense>
    </div>
  );
};

export default Landing;
