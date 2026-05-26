"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Database, Sparkles, BrainCircuit, Activity } from "lucide-react";

interface Props {
    isVisible: boolean;
}

const STEPS = [
    { id: 1, text: "Validating Schema & Parsing Telemetry...", icon: Database, duration: 2000 },
    { id: 2, text: "Cleaning Data & Normalizing Inputs...", icon: Sparkles, duration: 3000 },
    { id: 3, text: "Running Isolation Forest ML Models...", icon: Activity, duration: 4000 },
    { id: 4, text: "Generating AI Clinical Explanations...", icon: BrainCircuit, duration: 99999 }, // Stays here until API finishes
];

export default function ProcessingOverlay({ isVisible }: Props) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            return;
        }

        let timeout: NodeJS.Timeout;

        const advanceStep = (stepIndex: number) => {
            setCurrentStep(stepIndex);
            if (stepIndex < STEPS.length - 1) {
                timeout = setTimeout(() => {
                    advanceStep(stepIndex + 1);
                }, STEPS[stepIndex].duration);
            }
        };

        advanceStep(0);
        return () => clearTimeout(timeout);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
                >
                    <div className="bg-surface border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-surface-2">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 15, ease: "linear" }}
                            />
                        </div>

                        <div className="space-y-6 mt-4">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index === currentStep;
                                const isPast = index < currentStep;

                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: isActive || isPast ? 1 : 0.4, x: 0 }}
                                        className={`flex items-center space-x-4 ${isActive ? 'text-primary' : isPast ? 'text-success' : 'text-muted'}`}
                                    >
                                        <div className="flex-shrink-0">
                                            {isPast ? (
                                                <CheckCircle className="h-6 w-6" />
                                            ) : isActive ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <Icon className="h-6 w-6 opacity-50" />
                                            )}
                                        </div>
                                        <span className={`font-medium ${isActive ? 'text-accent text-lg' : isPast ? 'text-muted' : 'text-muted'}`}>
                                            {step.text}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}