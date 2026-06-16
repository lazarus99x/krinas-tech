import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Shield,
  User,
  Zap,
  DollarSign,
  Brain,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { OnboardingData, Player } from "../types";
import Logo from "./Logo";

interface OnboardingFlowProps {
  username: string;
  onComplete: (data: OnboardingData) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  username,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    primaryDirective: "",
    topObstacle: "",
    hourlyRate: "",
  });

  const questions = [
    {
      id: "primaryDirective",
      title: "IDENTIFY PROTOCOL",
      subtitle: "What is your primary professional function?",
      placeholder: "e.g. Frontend Developer, Founder, Writer...",
      icon: <User className="text-system-blue" size={32} />,
      examples: [
        "Software Engineer",
        "Digital Artist",
        "Entrepreneur",
        "Student",
      ],
    },
    {
      id: "topObstacle",
      title: "THREAT ASSESSMENT",
      subtitle: "What is the single biggest threat to your execution?",
      placeholder: "e.g. Procrastination, Doomscrolling, Lack of Clarity...",
      icon: <Brain className="text-system-red" size={32} />,
      examples: [
        "Social Media Addiction",
        "Analysis Paralysis",
        "Burnout",
        "Distractions",
      ],
    },
    {
      id: "hourlyRate",
      title: "VALUE CALCULATION",
      subtitle: "What is 1 hour of your deep work worth?",
      placeholder: "e.g. $50, $200, Priceless...",
      icon: <DollarSign className="text-system-green" size={32} />,
      examples: ["$50/hr", "$100/hr", "$500/hr", "Estimating..."],
    },
  ];

  const handleNext = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Submit
      setLoading(true);
      const data: OnboardingData = {
        primaryDirective: answers.primaryDirective,
        topObstacle: answers.topObstacle,
        hourlyRate: answers.hourlyRate,
        completedAt: Date.now(),
      };

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            player_data: {
              ...(await getCurrentPlayerData()),
              onboarding: data,
            },
          })
          .eq("username", username);

        if (error) throw error;

        // Artificial delay for effect
        setTimeout(() => {
          onComplete(data);
        }, 1500);
      } catch (err) {
        console.error("Onboarding Save Error:", err);
        setLoading(false);
        // Fallback: Proceed anyway in app state
        onComplete(data);
      }
    }
  };

  // Helper to get current player data safely to merge
  const getCurrentPlayerData = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("player_data")
      .eq("username", username)
      .single();
    return data?.player_data || {};
  };

  const currentQ = questions[step];
  const isLastStep = step === questions.length - 1;
  const canProceed = Object.values(answers)[step]?.length > 2;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-colitems-center justify-center text-white font-mono p-6">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

      {/* ProgressBar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gray-900">
        <motion.div
          className="h-full bg-system-blue shadow-glow"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="max-w-2xl w-full mx-auto relative z-10 flex flex-col items-center">
        <Logo className="w-16 h-16 mb-12 animate-pulse" />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-900 border border-gray-800 mb-6 shadow-2xl">
                {currentQ.icon}
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                {currentQ.title}
              </h2>
              <p className="text-xl text-gray-400 font-serif italic">
                {currentQ.subtitle}
              </p>
            </div>

            <div className="relative mb-12">
              <input
                autoFocus
                type="text"
                value={answers[currentQ.id as keyof typeof answers]}
                onChange={(e) =>
                  setAnswers({ ...answers, [currentQ.id]: e.target.value })
                }
                className="w-full bg-transparent border-b-2 border-gray-800 text-center text-3xl md:text-4xl py-4 focus:border-system-blue outline-none transition-colors text-white placeholder-gray-800"
                placeholder={currentQ.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canProceed) handleNext();
                }}
              />
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap justify-center gap-3 mb-16 opacity-50">
              {currentQ.examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [currentQ.id]: ex })}
                  className="text-xs border border-gray-700 px-3 py-1 rounded-full hover:bg-gray-800 hover:text-white transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center w-full">
          <button
            onClick={handleNext}
            disabled={!canProceed || loading}
            className={`
              group relative overflow-hidden bg-white text-black px-12 py-4 font-black uppercase tracking-widest text-lg md:text-xl transition-all
              ${!canProceed ? "opacity-30 cursor-not-allowed" : "hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]"}
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                PROCESSING <Zap size={18} className="animate-spin" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isLastStep ? "INITIALIZE" : "NEXT"}{" "}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </span>
            )}

            {/* Hover Glare */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
          </button>
        </div>

        <div className="mt-8 text-gray-600 font-mono text-xs">
          STEP {step + 1} OF {questions.length} // DATA ENCRYPTED
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
