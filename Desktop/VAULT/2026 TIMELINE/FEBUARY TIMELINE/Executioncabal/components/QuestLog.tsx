import React, { useState, useEffect, useRef } from "react";
import { Quest, Rank, TaskStatus, TaskType, Player } from "../types";
import {
  Check,
  X,
  Skull,
  Loader2,
  Play,
  AlertCircle,
  Upload,
  Trash2,
  Pin,
  Wallet,
  Camera,
  Plus,
  Zap,
  Timer,
  Filter,
  ArrowDownUp,
  ArrowUp,
  History,
  ListFilter,
  Clock,
  ChevronDown,
  SortAsc,
  SortDesc,
  Image as ImageIcon,
  User,
  Crown,
  Edit,
} from "lucide-react";
import { RANK_COLORS, RANK_TASK_THRESHOLDS, RANK_ORDER } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { savePlayerData } from "../lib/supabase";

// ... existing QuestLogProps and types ...
interface QuestLogProps {
  player: Player;
  quests: Quest[];
  onStartQuest: (id: string) => void;
  onFailQuest: (id: string) => void;
  onVerifyProof: (
    id: string,
    proof: string,
    image?: string | null
  ) => Promise<void>;
  onAddQuest: (
    input: string,
    startTime?: string,
    deadline?: string
  ) => Promise<void>;
  onEditQuest: (id: string, newTitle: string, newDesc: string) => Promise<void>;
  onTogglePin: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onUpdatePlayer: (updates: Partial<Player>) => void;
  loading: boolean;
}

type SortOption = "SMART" | "NEWEST" | "OLDEST" | "URGENT" | "HARDEST";
type ArchiveSortOption =
  | "RECENT"
  | "OLDEST"
  | "FAILED"
  | "COMPLETED"
  | "HARDEST";

// ... existing helper functions (compressImage, getTimerColor, formatCountdown) ...
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const getTimerColor = (diff: number) => {
  const hours = diff / (1000 * 60 * 60);
  if (hours < 4) return "text-red-500 animate-pulse";
  if (hours < 24) return "text-yellow-500";
  return "text-system-blue";
};

const formatCountdown = (deadline?: number) => {
  if (!deadline) return "NO DEADLINE";
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) return "EXPIRED";

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  if (d > 0) {
    return `${d}d ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// ... QuestCard component ...
const QuestCard: React.FC<{
  quest: Quest;
  onStart: () => void;
  onFail: () => void;
  onVerify: (proof: string, image?: string | null) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ quest, onStart, onFail, onVerify, onTogglePin, onDelete, onEdit }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [timeColor, setTimeColor] = useState("text-gray-500");
  const [showProofInput, setShowProofInput] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      (quest.status === TaskStatus.RUNNING ||
        quest.status === TaskStatus.IDLE) &&
      quest.deadline
    ) {
      const updateTimer = () => {
        const diff = quest.deadline! - Date.now();
        const str = formatCountdown(quest.deadline);
        setTimeLeft(str);
        setTimeColor(getTimerColor(diff));

        if (str === "EXPIRED" && quest.status !== TaskStatus.FAILED) {
          onFail();
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [quest.status, quest.deadline, onFail]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      try {
        const compressedBase64 = await compressImage(file);
        setProofImage(compressedBase64);
      } catch (err) {
        console.error("Image processing failed", err);
        alert("Failed to process image. Try a smaller file.");
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const handleSubmitProof = async () => {
    if (!proofImage) return;
    setVerifying(true);
    await onVerify(proofText, proofImage);
    setVerifying(false);
    setShowProofInput(false);
    setProofText("");
    setProofImage(null);
  };

  const isInteractive =
    quest.status === TaskStatus.IDLE || quest.status === TaskStatus.RUNNING;
  const isDaily = quest.type === TaskType.DAILY;
  const isArchived =
    quest.status === TaskStatus.COMPLETED || quest.status === TaskStatus.FAILED;

  const statusStyles = {
    [TaskStatus.IDLE]: isDaily
      ? "border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 shadow-sm"
      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
    [TaskStatus.RUNNING]:
      "border-blue-200 dark:border-system-blue/30 bg-blue-50/20 dark:bg-system-blue/5 shadow-sm",
    [TaskStatus.COMPLETED]:
      "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60 grayscale",
    [TaskStatus.FAILED]:
      "border-red-200 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/5",
    [TaskStatus.REVIEW]: "border-yellow-200 bg-yellow-50",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        relative p-4 md:p-5 mb-4 rounded-xl border transition-all duration-200
        ${statusStyles[quest.status]}
        ${quest.isPinned ? "ring-1 ring-system-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.05)]" : ""}
        ${isDaily ? "shadow-[0_0_10px_rgba(168,85,247,0.1)]" : ""}
      `}
    >
      {/* ... (Quest Card Content - Title, Description, Buttons) ... */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${RANK_COLORS[quest.difficulty]} border-current bg-current/10`}
            >
              {quest.difficulty}
            </span>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${isDaily ? "text-purple-600 dark:text-purple-400 font-bold" : "text-gray-500"}`}
            >
              {quest.type}
            </span>
            {isDaily && (
              <Zap size={10} className="text-purple-500 fill-current" />
            )}
          </div>

          <div className="flex items-center gap-3">
            {isInteractive && !isDaily && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 rounded-lg transition-colors touch-manipulation text-gray-400 dark:text-gray-600 hover:text-system-blue hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit Directive"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                  }}
                  className={`p-1.5 rounded-lg transition-colors touch-manipulation ${
                    quest.isPinned
                      ? "text-system-gold bg-yellow-50 dark:bg-yellow-900/20 opacity-100"
                      : "text-gray-400 dark:text-gray-600 hover:text-system-blue hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title={quest.isPinned ? "Unpin Directive" : "Pin Directive"}
                >
                  <Pin
                    size={16}
                    className={quest.isPinned ? "fill-current" : ""}
                  />
                </button>
              </div>
            )}

            <div
              className={`px-2 py-1 rounded text-xs font-black font-mono shadow-sm
                    ${quest.status === TaskStatus.FAILED ? "bg-red-100 text-red-600" : "bg-blue-100 text-system-blue dark:bg-blue-900/30 dark:text-blue-200"}`}
            >
              {quest.status === TaskStatus.FAILED
                ? `-${quest.penaltyXP}`
                : `+${quest.xpReward}`}{" "}
              XP
            </div>
          </div>
        </div>

        <h3
          className={`text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight ${quest.status === TaskStatus.COMPLETED ? "line-through" : ""}`}
        >
          {quest.title}
        </h3>
      </div>

      {isInteractive && (quest.startTime || quest.deadline) && (
        <div className="mb-4 bg-gray-100 dark:bg-black/40 rounded-lg p-3 flex flex-col gap-2 border border-gray-200 dark:border-gray-800/50">
          {quest.startTime && (
            <div className="flex items-center justify-between gap-4 mb-2 md:mb-1">
              <div className="flex items-center gap-2 text-gray-500 shrink-0">
                <Clock size={14} />
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                  Scheduled Start
                </span>
              </div>
              <div className="text-right text-[11px] sm:text-sm font-mono font-bold tracking-tight text-gray-600 dark:text-gray-300 truncate">
                {new Date(quest.startTime).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-400 shrink-0">
              <Timer size={14} />
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                Time Remaining
              </span>
            </div>
            <div
              className={`text-right text-base sm:text-lg md:text-xl font-mono font-bold tracking-tight truncate ${timeLeft === "EXPIRED" ? "text-red-500" : timeColor}`}
            >
              {timeLeft}
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-sans leading-relaxed">
        {quest.description}
      </p>

      {quest.lastVerificationMessage &&
        quest.verificationAttempts > 0 &&
        quest.status !== TaskStatus.COMPLETED && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-3 text-xs text-red-700 dark:text-red-300">
            <div className="font-bold uppercase flex items-center gap-2 mb-1">
              <AlertCircle size={12} /> Verification Failed
            </div>
            <p>{quest.lastVerificationMessage}</p>
          </div>
        )}

      <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-3 mt-auto">
        {quest.verificationAttempts > 0 &&
          quest.status !== TaskStatus.FAILED && (
            <span className="text-orange-500 flex items-center gap-1">
              <AlertCircle size={10} /> {quest.verificationAttempts}/3 Attempts
              Used
            </span>
          )}
        {isInteractive && quest.deadline && (
          <span
            className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 uppercase tracking-tight bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded"
            title={`Deadline: ${new Date(quest.deadline).toLocaleString()}`}
          >
            <Timer size={10} />
            {new Date(quest.deadline).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            •{" "}
            {new Date(quest.deadline).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {isArchived && quest.completedAt && (
          <span className="flex items-center gap-1 text-gray-400 uppercase tracking-tight">
            <Timer size={10} />
            {new Date(quest.completedAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            •{" "}
            {new Date(quest.completedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {isInteractive && (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          {quest.status === TaskStatus.IDLE ? (
            <>
              <button
                onClick={onStart}
                className="flex-1 bg-system-blue text-white font-bold text-sm py-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20"
              >
                <Play size={18} className="fill-current" /> INITIATE TASK
              </button>
              <button
                onClick={onDelete}
                className="px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95 flex items-center justify-center"
                title="Delete Directive (-100 Action XP)"
              >
                <Trash2 size={20} />
              </button>
            </>
          ) : !showProofInput ? (
            <>
              <button
                onClick={() => setShowProofInput(true)}
                className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95 shadow-lg"
              >
                <Upload size={18} /> COMPLETE & VERIFY
              </button>
              <button
                onClick={onFail}
                className="px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95 flex items-center justify-center"
                title="Fail Task (-100 Action XP)"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <div className="w-full bg-gray-50 dark:bg-black/40 rounded-xl p-3 border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
              <textarea
                rows={2}
                placeholder="Description (Optional)..."
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 text-sm p-2 outline-none focus:border-system-blue transition-colors mb-2 resize-none"
              />

              {proofImage ? (
                <div className="relative w-full max-h-[200px] mb-3 bg-black/5 dark:bg-white/5 rounded-md overflow-hidden flex items-center justify-center group">
                  <img
                    src={proofImage}
                    alt="Proof"
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={() => setProofImage(null)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm hover:bg-red-500 transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-3 p-4 border border-dashed border-system-red/30 bg-red-50/10 rounded-lg text-center">
                  <p className="text-[10px] font-bold text-system-red uppercase">
                    Screenshot Proof Mandatory
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processingImage}
                  className={`flex-1 py-3 rounded-md border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-colors ${proofImage ? "border-system-blue/50 text-system-blue" : "border-system-red text-system-red bg-red-50 dark:bg-red-900/10"}`}
                >
                  {processingImage ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Camera size={14} />
                  )}
                  {processingImage
                    ? "OPTIMIZING..."
                    : proofImage
                      ? "RETAKE"
                      : "UPLOAD PROOF"}
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={verifying || !proofImage || processingImage}
                  className="flex-[2] bg-system-blue text-white py-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                  {proofImage ? "VERIFY PROOF" : "REQ: IMAGE"}
                </button>
              </div>
              <button
                onClick={() => setShowProofInput(false)}
                className="w-full mt-2 text-[10px] text-gray-400 hover:text-gray-600 py-1"
              >
                CANCEL SUBMISSION
              </button>
            </div>
          )}
        </div>
      )}

      {isArchived && (
        <div className="mt-2 text-right">
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 ml-auto"
          >
            <Trash2 size={12} /> DELETE RECORD
          </button>
        </div>
      )}
    </motion.div>
  );
};

const QuestLog: React.FC<QuestLogProps> = ({
  player,
  quests,
  onStartQuest,
  onFailQuest,
  onVerifyProof,
  onAddQuest,
  onEditQuest,
  onTogglePin,
  onDeleteQuest,
  onUpdatePlayer,
  loading,
}) => {
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("SMART");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Edit State
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    if (!editingQuest) return;
    setIsSavingEdit(true);
    await onEditQuest(editingQuest.id, editTitle, editDesc);
    setIsSavingEdit(false);
    setEditingQuest(null);
  };

  // Archive Sorting
  const [archiveSort, setArchiveSort] = useState<ArchiveSortOption>("RECENT");
  const [showArchiveSort, setShowArchiveSort] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Updated Cost
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const XP_COST = 50;
  const canAfford = player.boughtXp >= XP_COST;

  const earnedXp = Math.max(0, player.currentXp - player.boughtXp);

  // Rank Calculation for Counter
  const nextRank = RANK_ORDER[RANK_ORDER.indexOf(player.rank) + 1] || Rank.X;
  const nextThreshold = Number(RANK_TASK_THRESHOLDS[nextRank]) || 100;
  const tasksCompleted = Number(player.totalTasksCompleted) || 0;

  // Active Directives Count
  const activeCount = quests.filter(
    (q) => q.status === TaskStatus.IDLE || q.status === TaskStatus.RUNNING
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !canAfford) return;
    await onAddQuest(input, startTime || undefined, deadline || undefined);
    setInput("");
    setStartTime("");
    setDeadline("");
    setIsAdding(false);
  };

  const handleAvatarUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Please use an image under 5MB.");
      return;
    }
    setAvatarLoading(true);
    compressImage(file)
      .then((base64) => {
        try {
          onUpdatePlayer({ avatar: base64 });
        } catch (e) {
          console.error("Failed to update avatar", e);
        }
        setAvatarLoading(false);
      })
      .catch((err) => {
        console.error("Avatar compression failed", err);
        setAvatarLoading(false);
      });
  };

  const getRankValue = (rank: Rank): number => {
    const ranks = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6, X: 7 };
    return ranks[rank] || 0;
  };

  const activeQuests = quests
    .filter(
      (q) => q.status === TaskStatus.IDLE || q.status === TaskStatus.RUNNING
    )
    .sort((a, b) => {
      if (sortBy === "SMART") {
        if (a.type === TaskType.DAILY && b.type !== TaskType.DAILY) return -1;
        if (b.type === TaskType.DAILY && a.type !== TaskType.DAILY) return 1;
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      }
      if (sortBy === "NEWEST") return 0;
      if (sortBy === "URGENT") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline - b.deadline;
      }
      if (sortBy === "HARDEST") {
        return getRankValue(b.difficulty) - getRankValue(a.difficulty);
      }
      return 0;
    });

  if (sortBy === "OLDEST") {
    activeQuests.reverse();
  }

  const historyQuests = quests
    .filter(
      (q) =>
        (q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED) &&
        q.isVisibleInLog !== false
    )
    .sort((a, b) => {
      // Use completedAt if available, fallback to startTime
      const timeA = a.completedAt || a.startTime || 0;
      const timeB = b.completedAt || b.startTime || 0;

      if (archiveSort === "RECENT") return timeB - timeA;
      if (archiveSort === "OLDEST") return timeA - timeB;
      if (archiveSort === "FAILED")
        return a.status === TaskStatus.FAILED ? -1 : 1;
      if (archiveSort === "COMPLETED")
        return a.status === TaskStatus.COMPLETED ? -1 : 1;
      if (archiveSort === "HARDEST")
        return getRankValue(b.difficulty) - getRankValue(a.difficulty);
      return 0;
    });

  const sortOptions = [
    { id: "SMART", label: "Smart Sort", icon: Zap },
    { id: "NEWEST", label: "Newest First", icon: ArrowDownUp },
    { id: "OLDEST", label: "Oldest First", icon: History },
    { id: "URGENT", label: "Urgent", icon: Timer },
    { id: "HARDEST", label: "Hardest", icon: ArrowUp },
  ];

  return (
    <div
      className="flex-1 h-full overflow-y-auto p-4 md:p-6 relative scroll-smooth bg-gray-50/50 dark:bg-black"
      onClick={() => {
        setShowSortMenu(false);
        setShowArchiveSort(false);
      }}
    >
      <div className="max-w-2xl mx-auto pb-20">
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden flex items-center justify-center relative">
                  {avatarLoading ? (
                    <Loader2
                      className="animate-spin text-system-blue"
                      size={20}
                    />
                  ) : player.avatar ? (
                    <img
                      src={player.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-50"
                    />
                  ) : (
                    <User size={24} className="text-gray-400" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-black ${RANK_COLORS[player.rank].replace("text-", "bg-")}`}
                ></div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpdate}
                />
              </div>

              {/* Title & Rank */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                  {player.name}
                  {/* New Styled Rank Badge */}
                  <div
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${RANK_COLORS[player.rank]} border-current bg-current/10 flex items-center gap-1 uppercase tracking-wider`}
                  >
                    <Crown size={10} /> {player.rank}
                  </div>
                </h1>
                <p className="text-xs text-gray-500 font-mono font-bold uppercase tracking-wide">
                  {player.title}{" "}
                  <span className="text-system-blue ml-2">
                    // {activeCount} ACTIVE DIRECTIVES
                  </span>
                </p>
              </div>
            </div>

            {/* Task Counter (NEW) & Sort Menu */}
            <div className="flex items-center gap-4">
              {/* Simple Progress Counter */}
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider">
                  Tasks Verified
                </div>
                <div className="text-lg font-mono font-bold text-system-blue">
                  {tasksCompleted}{" "}
                  <span className="text-gray-400 text-sm">
                    / {nextThreshold}
                  </span>
                </div>
              </div>

              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Filter size={16} />
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                    >
                      {sortOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSortBy(opt.id as SortOption);
                              setShowSortMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase transition-colors text-left
                                                ${
                                                  sortBy === opt.id
                                                    ? "bg-system-blue/10 text-system-blue"
                                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400 dark:hover:text-white"
                                                }`}
                          >
                            <Icon size={14} />
                            {opt.label}
                            {sortBy === opt.id && (
                              <Check size={14} className="ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col">
              <span className="text-[9px] text-gray-500 uppercase font-mono mb-1">
                Action XP (Credits)
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${player.boughtXp < 100 ? "bg-red-500 animate-pulse" : "bg-system-blue"}`}
                ></div>
                <span className="font-bold font-mono text-lg">
                  {player.boughtXp} XP
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col opacity-80">
              <span className="text-[9px] text-gray-500 uppercase font-mono mb-1">
                Reward Pool (Earned)
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="font-bold font-mono text-lg">
                  {earnedXp} XP
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8 relative group z-20">
          {/* ... Add Task Form ... */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-800 p-3 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-system-blue hover:border-system-blue transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-bold">Assign New Directive</span>
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Task description..."
                  className="flex-1 bg-gray-50 dark:bg-black px-3 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none rounded-lg border border-transparent focus:border-system-blue transition-colors"
                  autoFocus
                  disabled={loading}
                />

                <div className="flex gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 font-mono uppercase px-1">
                      Start Time
                    </span>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-11 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-xs md:text-sm text-gray-900 dark:text-white focus:border-system-blue outline-none dark:[color-scheme:dark] md:w-auto w-full"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 font-mono uppercase px-1">
                      End Time
                    </span>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="h-11 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-xs md:text-sm text-gray-900 dark:text-white focus:border-system-blue outline-none dark:[color-scheme:dark] md:w-auto w-full"
                    />
                  </div>
                </div>
              </div>

              {!canAfford && (
                <div className="text-xs text-red-500 font-mono text-center bg-red-900/10 p-1 rounded">
                  INSUFFICIENT ACTION XP. STORE RECHARGE REQUIRED.
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading || !input.trim() || !canAfford}
                  className={`flex-1 text-white py-3 px-4 rounded-lg flex items-center justify-center font-bold text-xs gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-0
                    ${canAfford ? "bg-system-blue hover:bg-blue-600" : "bg-gray-700 text-gray-500"}
                  `}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Check size={16} />
                  )}
                  <span className="truncate">ASSIGN</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4 mb-12">
          <AnimatePresence mode="popLayout">
            {activeQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onStart={() => onStartQuest(quest.id)}
                onFail={() => onFailQuest(quest.id)}
                onVerify={(proof, image) =>
                  onVerifyProof(quest.id, proof, image)
                }
                onTogglePin={() => onTogglePin(quest.id)}
                onDelete={() => onDeleteQuest(quest.id)}
                onEdit={() => {
                  setEditingQuest(quest);
                  setEditTitle(quest.title);
                  setEditDesc(quest.description);
                }}
              />
            ))}
          </AnimatePresence>
          {activeQuests.length === 0 && (
            <div className="text-center py-12 opacity-40">
              <Skull size={48} className="mx-auto mb-2" />
              <p className="font-mono text-xs">NO PENDING DIRECTIVES</p>
            </div>
          )}
        </div>

        {/* ... Archive Section ... */}
        {historyQuests.length > 0 && (
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-wider"
              >
                {showHistory ? "Close Archive" : "View Archive"}
                <History size={14} />
              </button>

              {showHistory && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowArchiveSort(!showArchiveSort)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 hover:text-system-blue bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                  >
                    <ListFilter size={12} />
                    SORT: {archiveSort}
                  </button>
                  <AnimatePresence>
                    {showArchiveSort && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 bottom-full mb-2 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden py-1"
                      >
                        {[
                          "RECENT",
                          "OLDEST",
                          "FAILED",
                          "COMPLETED",
                          "HARDEST",
                        ].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setArchiveSort(opt as ArchiveSortOption);
                              setShowArchiveSort(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-gray-100 dark:hover:bg-white/5 ${archiveSort === opt ? "text-system-blue" : "text-gray-500"}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  {historyQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onStart={() => {}}
                      onFail={() => {}}
                      onVerify={() => {}}
                      onTogglePin={() => {}}
                      onDelete={() => onDeleteQuest(quest.id)}
                      onEdit={function (): void {
                        throw new Error("Function not implemented.");
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingQuest(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit size={24} className="text-system-blue" />
                Edit Directive
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                    Title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black p-3 rounded-lg border border-gray-200 dark:border-gray-800 outline-none focus:border-system-blue font-bold text-gray-900 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-black p-3 rounded-lg border border-gray-200 dark:border-gray-800 outline-none focus:border-system-blue resize-none text-gray-900 dark:text-white transition-colors"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/30 text-xs text-yellow-700 dark:text-yellow-400 font-mono">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <AlertCircle size={12} /> SYSTEM PROTOCOL:
                  </span>
                  Duration and Difficulty are locked to prevent procrastination.
                  The System will verify this edit.
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingQuest(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 bg-system-blue text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isSavingEdit ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  SAVE CHANGES
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestLog;
