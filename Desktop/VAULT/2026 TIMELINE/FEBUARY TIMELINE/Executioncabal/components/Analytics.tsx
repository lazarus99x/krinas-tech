import React from "react";
import {
  Player,
  StatType,
  Rank,
  Quest,
  TaskStatus,
  Currency,
  Transaction,
} from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  TrendingUp,
  Target,
  Clock,
  Package,
  Zap,
  ExternalLink,
  Shield,
  Brain,
  Eye,
  Lock,
  Hexagon,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { RANK_COLORS, RANK_ORDER, RANK_TASK_THRESHOLDS } from "../constants";

const StatBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, max, color, icon }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 items-center">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-bold text-white">{value}</span>
    </div>
    <div className="h-2 bg-gray-200 dark:bg-gray-800 w-full overflow-hidden rounded-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
      />
    </div>
  </div>
);

// Hexagon Radar Chart for Attributes
const AttributeRadar: React.FC<{
  discipline: number;
  consistency: number;
  focus: number;
}> = ({ discipline, consistency, focus }) => {
  // Simple SVG calculation for a triangle/radar
  const max = 100;
  // Points: Top (Discipline), Bottom Right (Consistency), Bottom Left (Focus)
  // Center: 50, 50
  const d = (discipline / max) * 40;
  const c = (consistency / max) * 40;
  const f = (focus / max) * 40;

  const p1 = `50,${50 - d}`;
  const p2 = `${50 + c * 0.866},${50 + c * 0.5}`;
  const p3 = `${50 - f * 0.866},${50 + f * 0.5}`;

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Background Grid */}
        <polygon
          points="50,10 85,30 85,70 50,90 15,70 15,30"
          fill="none"
          stroke="#333"
          strokeWidth="1"
        />
        <polygon
          points="50,30 67,40 67,60 50,70 33,60 33,40"
          fill="none"
          stroke="#333"
          strokeWidth="1"
        />

        {/* Axis Labels */}
        <text
          x="50"
          y="5"
          textAnchor="middle"
          className="fill-system-blue text-[8px] font-mono font-bold"
        >
          DISCIPLINE
        </text>
        <text
          x="90"
          y="80"
          textAnchor="middle"
          className="fill-green-500 text-[8px] font-mono font-bold"
        >
          CONSISTENCY
        </text>
        <text
          x="10"
          y="80"
          textAnchor="middle"
          className="fill-purple-500 text-[8px] font-mono font-bold"
        >
          FOCUS
        </text>

        {/* Data Shape */}
        <motion.polygon
          initial={{ points: "50,50 50,50 50,50" }}
          animate={{ points: `${p1} ${p2} ${p3}` }}
          transition={{ duration: 1, ease: "easeOut" }}
          fill="rgba(0, 162, 255, 0.3)"
          stroke="#00A2FF"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>
    </div>
  );
};

interface AnalyticsProps {
  player: Player;
  quests?: Quest[];
  transactions?: Transaction[];
  onUseItem?: (instanceId: string, itemId: string) => void;
  currency?: Currency;
}

const Analytics: React.FC<AnalyticsProps> = ({
  player,
  quests = [],
  transactions = [],
  onUseItem,
  currency = "USD",
}) => {
  const maxStat = Math.max(...(Object.values(player.stats) as number[]), 50);
  const inventoryCount = player.inventory?.length || 0;

  const [selectedDay, setSelectedDay] = React.useState<{
    date: string;
    completed: number;
    failed: number;
  } | null>(null);

  // Calculate Progress based on Tasks
  const nextRank = RANK_ORDER[RANK_ORDER.indexOf(player.rank) + 1] || Rank.X;
  const currentThreshold = RANK_TASK_THRESHOLDS[player.rank];
  const nextThreshold = RANK_TASK_THRESHOLDS[nextRank];

  const tasksNeeded = nextThreshold - player.totalTasksCompleted;

  // Scroll to end of chart on load
  const calendarRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        if (calendarRef.current) {
          calendarRef.current.scrollLeft = calendarRef.current.scrollWidth;
        }
      }, 100);
    }
  }, []);

  // Weekly Execution Data - UPDATED LOGIC to use `completedAt`
  // We want to see tasks COMPLETED on a specific day, regardless of when they started.
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyStats = last30Days.map((date) => {
    // Find tasks completed or failed on this specific date
    const dayQuests = quests.filter((q) => {
      if (!q.completedAt) return false;
      return new Date(q.completedAt).toISOString().split("T")[0] === date;
    });

    return {
      date,
      completed: dayQuests.filter((q) => q.status === TaskStatus.COMPLETED)
        .length,
      failed: dayQuests.filter((q) => q.status === TaskStatus.FAILED).length,
    };
  });

  // Calculate Net Worth Estimate based on Earned XP
  const earnedXp = Math.max(0, player.currentXp - player.boughtXp);
  const rate = currency === "NGN" ? 2 : 0.003; // Rate per XP
  const netWorth = (earnedXp * rate).toFixed(2);
  const currencySymbol = currency === "NGN" ? "₦" : "$";

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-6xl mx-auto pb-20">
        {/* --- LEVEL PROGRESS SECTION (REMOVED PROGRESS BAR) --- */}
        <section className="mb-12 relative">
          <div className="absolute inset-0 bg-system-blue/5 blur-3xl -z-10" />
          <div className="bg-white/50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-1">
                  System Evaluation
                </h2>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                    LEVEL {player.level}
                  </span>
                  <span
                    className={`text-2xl md:text-3xl font-bold font-mono ${RANK_COLORS[player.rank]} uppercase`}
                  >
                    {player.rank}-RANK
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-xs font-mono text-system-blue font-bold uppercase mb-1">
                  Task Progression
                </div>
                <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                  {player.totalTasksCompleted}{" "}
                  <span className="text-gray-500 text-lg">
                    / {nextThreshold} TASKS
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tasksNeeded > 0
                    ? `${tasksNeeded} verified completions for promotion`
                    : "MAX RANK ACHIEVED"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* ... Behavioral Matrix and Execution Chart (unchanged) ... */}
          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-4">
              <Hexagon size={18} className="text-purple-500" />
              Behavioral Matrix
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <AttributeRadar
                discipline={player.behaviorStats?.discipline || 50}
                consistency={player.behaviorStats?.consistency || 50}
                focus={player.behaviorStats?.focus || 50}
              />
              <div className="space-y-4 flex-1 w-full">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Discipline
                  </span>
                  <span className="font-bold text-system-blue">
                    {player.behaviorStats?.discipline || 50}/100
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Consistency
                  </span>
                  <span className="font-bold text-green-500">
                    {player.behaviorStats?.consistency || 50}/100
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Focus
                  </span>
                  <span className="font-bold text-purple-500">
                    {player.behaviorStats?.focus || 50}/100
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Est. Net Worth
                  </span>
                  <span className="font-bold text-system-gold">
                    {currencySymbol}
                    {Number(netWorth).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* --- EXECUTION OUTPUT CHART (3D ISOMETRIC) --- */}
          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <TrendingUp size={120} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-4 z-10 justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-system-gold" />
                Execution Output (30 Days)
              </div>
              <span className="text-[9px] font-mono text-gray-500 font-normal normal-case animate-pulse">
                (Tap bars for details)
              </span>
            </h3>

            {/* 3D Chart Container - Scrollable on Mobile */}
            <div
              ref={calendarRef}
              className="flex-1 w-full overflow-x-auto pb-4 custom-scrollbar z-10 scroll-smooth"
            >
              <div
                className="min-w-[1200px] h-64 flex items-end justify-start gap-3 px-4 pt-10"
                style={{ perspective: "1000px" }}
              >
                {dailyStats.map((day, i) => {
                  const total = day.completed + day.failed;
                  const maxHeight = 160;
                  const scaleFactor = Math.min(1, total / 5);
                  const barHeight = Math.max(10, scaleFactor * maxHeight);

                  const successRatio = total > 0 ? day.completed / total : 0;
                  const failRatio = total > 0 ? day.failed / total : 0;

                  const successHeight = barHeight * successRatio;
                  const failHeight = barHeight * failRatio;

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className="relative flex flex-col items-center group cursor-pointer"
                    >
                      {/* Interaction Indicator (Replaces Tooltip) */}
                      <div className="absolute -top-8 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 z-20">
                        <div className="bg-white dark:bg-system-gold text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <Eye size={10} /> VIEW
                        </div>
                      </div>

                      {/* 3D Bar Stack */}
                      <div
                        className="relative w-8 sm:w-12 transition-transform duration-300 group-hover:-translate-y-2"
                        style={{ height: `${maxHeight}px` }}
                      >
                        <div
                          className="absolute bottom-0 w-full flex flex-col-reverse items-center"
                          style={{
                            transformStyle: "preserve-3d",
                            transform: "rotateX(20deg)",
                          }}
                        >
                          {/* Success Block (Bottom) */}
                          {day.completed > 0 && (
                            <div
                              className="relative w-full transition-all duration-500"
                              style={{ height: `${successHeight}px` }}
                            >
                              {/* Front Face */}
                              <div className="absolute inset-0 neon-bar-success"></div>
                              {/* Right Face */}
                              <div className="absolute top-0 right-0 w-2 h-full neon-bar-success-right origin-right transform skew-y-[45deg] translate-x-full"></div>
                              {/* Top Face (Only if no failure block on top) */}
                              {day.failed === 0 && (
                                <div className="absolute top-0 left-0 w-full h-2 neon-bar-success-top origin-top transform skew-x-[45deg]"></div>
                              )}
                            </div>
                          )}

                          {/* Failure Block (Top) */}
                          {day.failed > 0 && (
                            <div
                              className="relative w-full transition-all duration-500"
                              style={{ height: `${failHeight}px` }}
                            >
                              {/* Front Face */}
                              <div className="absolute inset-0 neon-bar-failure"></div>
                              {/* Right Face */}
                              <div className="absolute top-0 right-0 w-2 h-full neon-bar-failure-right origin-right transform skew-y-[45deg] translate-x-full"></div>
                              {/* Top Face */}
                              <div className="absolute top-0 left-0 w-full h-2 neon-bar-failure-top origin-top transform skew-x-[45deg]"></div>
                            </div>
                          )}

                          {/* Ghost/Empty Placeholder if 0 */}
                          {total === 0 && (
                            <div className="relative w-full h-1 bg-white/5 border border-white/10"></div>
                          )}
                        </div>

                        {/* Reflection / Shadow - Colored Glow */}
                        <div
                          className={`absolute -bottom-4 left-0 w-full h-4 blur-xl rounded-full transform scale-x-150 ${day.failed > 0 ? "bg-red-500/40" : "bg-cyan-500/40"}`}
                        ></div>
                      </div>

                      <div className="mt-6 text-[9px] md:text-[10px] font-mono font-bold text-gray-500 uppercase flex flex-col items-center leading-tight">
                        <span>
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-gray-400 dark:text-gray-600">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-2 text-[10px] uppercase font-mono font-bold text-gray-500 z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 neon-bar-success rounded-sm transform skew-x-12"></div>
                Verified
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 neon-bar-failure rounded-sm transform skew-x-12"></div>
                Failed
              </div>
            </div>
          </div>

          {/* DAILY ANALYSIS MODAL */}
          <AnimatePresence>
            {selectedDay && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedDay(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <TrendingUp size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-xs font-mono font-bold text-gray-500 uppercase mb-2">
                        Daily Analysis Protocol
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic leading-none">
                            {new Date(selectedDay.date).toLocaleDateString(
                              "en-US",
                              { weekday: "long" }
                            )}
                          </h3>
                          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {new Date(selectedDay.date).toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs font-mono font-bold">
                          <div className="flex items-center gap-2 text-system-blue bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                            <CheckCircle2 size={12} />
                            {selectedDay.completed} COMPLETED
                          </div>
                          <div className="flex items-center gap-2 text-system-red bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                            <XCircle size={12} />
                            {selectedDay.failed} FAILED
                          </div>
                        </div>
                      </div>
                      {/* Insight Badge */}
                      {(() => {
                        const total =
                          selectedDay.completed + selectedDay.failed;
                        let insight = {
                          label: "NO ACTIVITY // STAGNANT",
                          color: "text-gray-500",
                          border: "border-gray-500",
                        };

                        if (total > 0) {
                          const ratio = selectedDay.completed / total;
                          if (ratio >= 0.8)
                            insight = {
                              label: "PROGRESSIVE FLOW // HIGH EFFICIENCY",
                              color: "text-system-blue",
                              border: "border-system-blue",
                            };
                          else if (ratio >= 0.5)
                            insight = {
                              label: "STEADY STATE // MAINTAINING MOMENTUM",
                              color: "text-system-gold",
                              border: "border-system-gold",
                            };
                          else
                            insight = {
                              label: "STALLING // IMMEDIATE ACTION REQUIRED",
                              color: "text-system-red",
                              border: "border-system-red",
                            };
                        }

                        return (
                          <div
                            className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-100 dark:bg-gray-900 border ${insight.border} ${insight.color} text-[10px] font-mono font-bold uppercase`}
                          >
                            <Activity size={12} />
                            {insight.label}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Detailed Task List */}
                  <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                    {/* Get precise tasks for this day */}
                    {(() => {
                      const dayQuests = quests.filter(
                        (q) =>
                          q.completedAt &&
                          new Date(q.completedAt)
                            .toISOString()
                            .split("T")[0] === selectedDay.date
                      );
                      if (dayQuests.length === 0)
                        return (
                          <div className="p-12 text-center text-gray-500 text-sm font-mono flex flex-col items-center gap-2">
                            <Clock size={32} className="opacity-50" />
                            NO ACTIVITY RECORDED
                          </div>
                        );
                      return (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {dayQuests.map((q) => (
                            <div
                              key={q.id}
                              className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                            >
                              <div
                                className={`mt-1 ${q.status === TaskStatus.COMPLETED ? "text-system-blue" : "text-system-red"}`}
                              >
                                {q.status === TaskStatus.COMPLETED ? "✓" : "✗"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-bold ${q.status === TaskStatus.COMPLETED ? "text-gray-900 dark:text-gray-200" : "text-gray-500 line-through"}`}
                                >
                                  {q.title}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase flex gap-3 items-center">
                                  <span>Rank: {q.difficulty}</span>
                                  <span>Reward: {q.xpReward} XP</span>
                                  {q.completedAt && (
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <Clock size={10} />
                                      {new Date(
                                        q.completedAt
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 dark:bg-black/40 border-t border-gray-200 dark:border-gray-800 text-center">
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-xs font-mono font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase transition-colors"
                    >
                      Dismiss Analysis
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ... Rest of components (Stat Distribution, Inventory) ... */}
        {/* --- STAT DISTRIBUTION --- */}
        <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 md:p-8 relative overflow-hidden shadow-sm rounded-2xl mb-12">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
            <Activity size={18} className="text-system-blue" />
            RPG Stats
          </h3>

          <div className="relative z-10 space-y-2">
            <StatBar
              label="Strength"
              value={player.stats.strength}
              max={maxStat}
              color="bg-red-500"
              icon={<Shield size={12} className="text-red-500" />}
            />
            <StatBar
              label="Agility"
              value={player.stats.agility}
              max={maxStat}
              color="bg-green-500"
              icon={<Activity size={12} className="text-green-500" />}
            />
            <StatBar
              label="Intelligence"
              value={player.stats.intelligence}
              max={maxStat}
              color="bg-blue-500"
              icon={<Brain size={12} className="text-blue-500" />}
            />
            <StatBar
              label="Vitality"
              value={player.stats.vitality}
              max={maxStat}
              color="bg-yellow-500"
              icon={<Zap size={12} className="text-yellow-500" />}
            />
            <StatBar
              label="Perception"
              value={player.stats.perception}
              max={maxStat}
              color="bg-purple-500"
              icon={<Eye size={12} className="text-purple-500" />}
            />
          </div>
        </div>

        {/* --- INVENTORY SECTION --- */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
              <Package className="text-system-gold" size={24} />
              Artifact Storage
            </h3>
            <div className="bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded text-xs font-mono font-bold text-gray-500">
              COUNT: <span className="text-white">{inventoryCount}</span>
            </div>
          </div>

          {inventoryCount === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center opacity-50">
              <Package size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-sm font-mono text-gray-500">
                STORAGE EMPTY // ACQUIRE ARTIFACTS IN SHOP
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {player.inventory?.map((item) => (
                  <motion.div
                    key={item.instanceId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden group hover:border-system-gold transition-all relative shadow-sm"
                  >
                    <div className="h-32 bg-black/20 relative overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          {item.content_link ? (
                            <ExternalLink
                              size={32}
                              className="text-system-blue"
                            />
                          ) : (
                            <Zap size={32} className="text-system-gold" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono text-white rounded border border-white/10 uppercase">
                        {item.type}
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-8 mb-4">
                        {item.description}
                      </p>

                      <button
                        onClick={() =>
                          onUseItem && onUseItem(item.instanceId, item.itemId)
                        }
                        className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-system-blue dark:hover:bg-system-gold hover:text-white dark:hover:text-black text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-2 active:scale-95"
                      >
                        {item.content_link ? (
                          <>
                            ACCESS <ExternalLink size={12} />
                          </>
                        ) : (
                          <>
                            ACTIVATE <Zap size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* --- FINANCIAL AUDIT TRAIL --- */}
        <section className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3 mb-6">
            <DollarSign className="text-system-green" size={24} />
            Financial Audit Trail
          </h3>

          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-mono text-xs">
                NO TRANSACTION HISTORY FOUND
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase">
                    <tr>
                      <th className="p-4">Type / Reference</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {tx.type.replace(/_/g, " ")}
                          </div>
                          <div
                            className="text-[10px] text-gray-500 truncate max-w-[150px]"
                            title={tx.reference_id}
                          >
                            REF: {tx.reference_id || "N/A"}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">
                          <div>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {new Date(tx.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td
                          className={`p-4 text-right font-bold ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount} XP
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                                ${
                                                  tx.status === "APPROVED"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                    : tx.status === "PENDING"
                                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
