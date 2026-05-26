"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
    UploadCloud, Sparkles, Database, AlertTriangle,
    BotMessageSquare, FileText, ArrowRight, ShieldCheck,
    Activity, Zap, Server, Code, FileSearch, ArrowUp
} from "lucide-react";

// --- 1. R3F Particle Background ---
function ParticleBackground() {
    const count = 3000;
    const mesh = useRef<THREE.Points>(null);

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 15; // Spread particles over a 15-unit cube
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = state.clock.getElapsedTime() * 0.05;
            mesh.current.rotation.x = state.clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.02} color="#00d4ff" transparent opacity={0.6} sizeAttenuation />
        </points>
    );
}

// --- 2. Animated Counter Hook ---
function AnimatedCounter({ from, to, suffix = "", duration = 2 }: { from: number, to: number, suffix?: string, duration?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [value, setValue] = useState(from);

    useEffect(() => {
        if (isInView) {
            const controls = animate(from, to, {
                duration,
                ease: "easeOut",
                onUpdate: (val) => setValue(Number(val.toFixed(to % 1 !== 0 ? 1 : 0))) // Handle decimals
            });
            return controls.stop;
        }
    }, [isInView, from, to, duration]);

    return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
    // --- Typewriter Effect Logic ---
    const phrases = ["Anomaly Detection", "Data Cleaning", "Missing Value Handling", "Clinical AI Insights"];
    const [text, setText] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Back to Top Logic ---
    const [showTopBtn, setShowTopBtn] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowTopBtn(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const goToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    useEffect(() => {
        const timeout = setTimeout(() => {
            const currentPhrase = phrases[phraseIndex];
            if (isDeleting) {
                setText(currentPhrase.substring(0, text.length - 1));
                if (text === "") {
                    setIsDeleting(false);
                    setPhraseIndex((prev) => (prev + 1) % phrases.length);
                }
            } else {
                setText(currentPhrase.substring(0, text.length + 1));
                if (text === currentPhrase) {
                    setTimeout(() => setIsDeleting(true), 2000);
                }
            }
        }, isDeleting ? 40 : 80);
        return () => clearTimeout(timeout);
    }, [text, isDeleting, phraseIndex]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background text-accent overflow-hidden pb-20"
        >

            {/* ================= HERO SECTION ================= */}
            <section className="relative h-[90vh] flex items-center justify-center border-b border-border">
                {/* 3D Canvas Background */}
                <div className="absolute inset-0 z-0 opacity-70">
                    <Canvas camera={{ position: [0, 0, 5] }}>
                        <ParticleBackground />
                    </Canvas>
                    {/* Gradient Overlay to blend canvas into background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
                </div>

                <div className="relative z-20 max-w-5xl mx-auto px-4 text-center space-y-8 mt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 bg-surface-2 border border-primary/30 text-primary px-4 py-2 rounded-full text-sm font-medium shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        <span>HIPAA Compliant · AI Powered</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight text-accent leading-tight"
                    >
                        Detect Medical Data Anomalies <br className="hidden md:block" />
                        Before They Become <span className="text-primary glow-text">Disasters</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-muted h-8"
                    >
                        Enterprise-grade machine learning for <span className="text-secondary font-medium">{text}</span><span className="animate-pulse">|</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8"
                    >
                        <Link
                            href="/upload"
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-primary hover:bg-primary/80 text-[#0a0f1e] px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)]"
                        >
                            <UploadCloud className="h-5 w-5" />
                            <span>Upload Your Dataset</span>
                        </Link>
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-surface-2 hover:bg-border border border-border text-accent px-8 py-4 rounded-xl font-medium transition-all"
                        >
                            <Activity className="h-5 w-5 text-primary" />
                            <span>View Live Demo</span>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ================= TECH STACK STRIP ================= */}
            <section className="border-b border-border bg-surface flex overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-8 w-full flex flex-wrap justify-center gap-6 md:gap-12 opacity-70">
                    {["FastAPI", "PostgreSQL", "Groq AI", "Isolation Forest", "Next.js", "Recharts"].map((tech, i) => (
                        <div key={i} className="flex items-center space-x-2 text-muted text-sm md:text-base font-mono">
                            <Code className="h-4 w-4" />
                            <span>{tech}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= STATS BANNER ================= */}
            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { label: "Records Analyzed", to: 10000, suffix: "+" },
                        { label: "Detection Accuracy", to: 99.2, suffix: "%" },
                        { label: "Avg Processing Time", to: 50, suffix: "ms" },
                        { label: "Data Security", to: 100, suffix: "% HIPAA" }
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-2"
                        >
                            <h3 className="text-4xl md:text-5xl font-bold text-primary">
                                <AnimatedCounter from={0} to={stat.to} suffix={stat.suffix} />
                            </h3>
                            <p className="text-muted text-sm uppercase tracking-widest">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ================= FEATURES GRID ================= */}
            <section className="py-20 bg-surface relative">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-accent">The Intelligence Engine</h2>
                        <p className="text-muted max-w-2xl mx-auto text-lg">
                            A comprehensive suite of tools designed specifically for the rigorous demands of modern clinical data processing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: UploadCloud, title: "Smart Upload", desc: "Drag and drop CSV or FHIR datasets. Secure vault encryption happens client-side." },
                            { icon: Sparkles, title: "Auto Data Cleaning", desc: "Automatically formats timestamps, standardizes units, and drops duplicate MRNs." },
                            { icon: Database, title: "Missing Value Imputation", desc: "Uses KNN and clinical logic to fill in the blanks without corrupting your dataset." },
                            { icon: AlertTriangle, title: "Isolation Forest Detection", desc: "Unsupervised ML hunts across multiple variables simultaneously to find hidden threats." },
                            { icon: BotMessageSquare, title: "AI Clinical Explanations", desc: "Groq LLaMA models act as your CMO, explaining exactly WHY a record was flagged." },
                            { icon: FileText, title: "PDF Report Export", desc: "Generate instant, board-ready clinical compliance reports with a single click." }
                        ].map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group bg-surface-2 border border-border p-8 rounded-2xl transition-all duration-300 hover:border-primary hover:shadow-[0_0_25px_rgba(0,212,255,0.15)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                                    <Icon className="h-10 w-10 text-primary mb-6" />
                                    <h3 className="text-xl font-bold text-accent mb-3">{feature.title}</h3>
                                    <p className="text-muted leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ================= AI WORKFLOW PIPELINE ================= */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-accent">How MedSentinel Works</h2>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center relative">
                        {/* Animated Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0 overflow-hidden rounded-full">
                            <motion.div
                                initial={{ x: "-100%" }}
                                whileInView={{ x: "100%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                                className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                            />
                        </div>

                        {[
                            { id: 1, title: "Upload", icon: UploadCloud },
                            { id: 2, title: "Schema Match", icon: FileSearch },
                            { id: 3, title: "Cleanse", icon: Sparkles },
                            { id: 4, title: "Score", icon: Activity },
                            { id: 5, title: "Explain", icon: BotMessageSquare },
                            { id: 6, title: "Export", icon: FileText }
                        ].map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative z-10 flex flex-col items-center group my-6 md:my-0"
                            >
                                <div className="w-16 h-16 rounded-full bg-surface-2 border-2 border-border flex items-center justify-center text-primary group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all duration-300">
                                    <step.icon className="h-6 w-6" />
                                </div>
                                <div className="mt-4 text-center">
                                    <span className="text-xs font-bold text-secondary tracking-widest block mb-1">STEP 0{step.id}</span>
                                    <h4 className="text-sm font-medium text-accent">{step.title}</h4>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= BACK TO TOP BUTTON ================= */}
            <AnimatePresence>
                {showTopBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={goToTop}
                        className="fixed bottom-8 right-8 p-3 bg-primary hover:bg-primary/80 text-[#0a0f1e] rounded-full shadow-lg z-50 transition-colors cursor-pointer"
                    >
                        <ArrowUp className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}