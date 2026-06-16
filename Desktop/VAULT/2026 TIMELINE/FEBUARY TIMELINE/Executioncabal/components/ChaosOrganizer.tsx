import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Player, Goal, Quest, ProposedTaskPlan, Rank } from "../types";

interface ChaosOrganizerProps {
  player: Player;
  goals: Goal[];
  quests: Quest[];
  onAcceptPlan: (plan: ProposedTaskPlan) => void;
  generatePlan: (input: string) => Promise<ProposedTaskPlan | null>;
}

const ChaosOrganizer: React.FC<ChaosOrganizerProps> = ({
  player,
  goals,
  quests,
  onAcceptPlan,
  generatePlan,
}) => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposedPlan, setProposedPlan] = useState<ProposedTaskPlan | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
  }, [input]);

  const handleOrganize = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    setProposedPlan(null);
    try {
      const plan = await generatePlan(input);
      if (plan) {
        setProposedPlan(plan);
      } else {
        alert("Failed to organize chaos. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the System.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecutePlan = () => {
    if (!proposedPlan) return;
    onAcceptPlan(proposedPlan);
    setProposedPlan(null);
    setInput("");
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col h-full bg-white dark:bg-[#0B0E14]">
      {/* Header */}
      <div className="p-6 md:p-10 border-b border-gray-100 dark:border-gray-900/50 flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-black font-sans tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <BrainCircuit className="text-system-blue" size={32} />
          Chaos Organizer
        </h1>
        <p className="text-gray-500 font-mono text-sm max-w-xl">
          Brain-dump all your unorganized thoughts, scattered tasks, and vague
          ideas here. The Execution Cabal System will structure them into a
          ruthlessly efficient battle plan based on Priority, XP Constraints,
          and Logic.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Editor Area */}
        <div className="relative group flex-1 flex flex-col min-h-[40vh]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type anything... e.g., 'I need to film 3 videos today, edit the podcast, also need to workout and maybe read that book chapter.' "
            className="w-full h-full min-h-[200px] flex-1 resize-none bg-transparent outline-none text-lg md:text-xl font-sans text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-700 leading-relaxed CustomScrollbar"
            spellCheck="false"
            disabled={isProcessing}
          />
        </div>

        {/* Action Button */}
        <AnimatePresence>
          {input.trim() && !proposedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-end sticky bottom-6"
            >
              <button
                onClick={handleOrganize}
                disabled={isProcessing}
                className="bg-system-blue hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    STRUCTURING CHAOS...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    ORGANIZE CHAOS
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Plan Review Area */}
        <AnimatePresence>
          {proposedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" />
                  Proposed Execution Plan
                </h2>
                <span className="text-xs font-mono font-bold text-system-blue bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  TOTAL COST:{" "}
                  {proposedPlan.projects.reduce(
                    (acc, p) => acc + p.tasks.length,
                    0
                  ) * 80}{" "}
                  XP
                </span>
              </div>

              <div className="space-y-6">
                {proposedPlan.projects.map((proj, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-[#111620] rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800"
                  >
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                      {proj.name}
                    </h3>
                    <div className="space-y-3">
                      {proj.tasks.map((task, j) => (
                        <div
                          key={j}
                          className="flex flex-col gap-1 p-3 bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                              {task.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                              {task.difficulty}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 line-clamp-2">
                            {task.description}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1 capitalize font-mono block">
                            {task.startTime && (
                              <>
                                Start:{" "}
                                {new Date(task.startTime).toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}{" "}
                                •{" "}
                              </>
                            )}
                            Due:{" "}
                            {task.deadline
                              ? new Date(task.deadline).toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "None"}{" "}
                            • Priority: {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={handleExecutePlan}
                  disabled={
                    player.boughtXp <
                    proposedPlan.projects.reduce(
                      (acc, p) => acc + p.tasks.length,
                      0
                    ) *
                      80
                  }
                  className="w-full sm:w-auto flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg shadow-green-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  {player.boughtXp >=
                  proposedPlan.projects.reduce(
                    (acc, p) => acc + p.tasks.length,
                    0
                  ) *
                    80
                    ? `EXECUTE PLAN (-${proposedPlan.projects.reduce((acc, p) => acc + p.tasks.length, 0) * 80} XP)`
                    : `INSUFFICIENT ACTION CREDITS`}
                </button>
                <button
                  onClick={() => setProposedPlan(null)}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-colors font-bold active:scale-95 flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  REJECT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChaosOrganizer;
