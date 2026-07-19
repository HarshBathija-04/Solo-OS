import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  BookOpen, Compass, Repeat, LayoutDashboard, Target, Swords, Timer, CalendarClock,
  Hexagon, GitBranch, Skull, Trophy, Crown, Flame, EyeOff, HeartPulse, Coins,
  BarChart3, FileText, Bot, Calendar, History, Settings, ArrowRight, Zap, Brain,
  Users, ShieldCheck, TrendingUp, Award, CheckCircle2, AlertCircle, Info,
} from "lucide-react";

export const dynamic = "force-static";

interface Entry {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  what: string;
  how: string;
  details?: string[];
  tips?: string[];
}

interface Section {
  group: string;
  blurb: string;
  entries: Entry[];
}

interface DetailedGuide {
  title: string;
  icon: typeof LayoutDashboard;
  color: string;
  sections: {
    heading: string;
    content: string;
    items?: string[];
  }[];
}

const DETAILED_GUIDES: DetailedGuide[] = [
  {
    title: "Understanding the XP System",
    icon: Zap,
    color: "arc-cyan",
    sections: [
      {
        heading: "How XP Works",
        content: "Experience Points (XP) are the core currency of your progression. Unlike coins, XP cannot be spent — it accumulates to level you up and unlock new capabilities.",
        items: [
          "Daily Quests: Each completed quest grants 10-50 XP based on difficulty",
          "Focus Sessions: 1 XP per focused minute (30 min session = 30 XP)",
          "Time Log: Match your schedule perfectly to earn streak bonuses",
          "Main Quest stages: Milestone completions grant 100-500 XP",
          "Boss defeats: Major XP rewards ranging from 200-1000 XP",
        ],
      },
      {
        heading: "Leveling Up",
        content: "Your level increases as you accumulate XP. Each level requires progressively more XP. Leveling up unlocks new skills, titles, and increases your attribute caps.",
      },
      {
        heading: "XP Multipliers",
        content: "Certain conditions multiply your XP gains: equipped titles can grant +5-15% XP, perfect streaks add bonus XP, and combo achievements during focused work sessions stack multipliers.",
      },
    ],
  },
  {
    title: "The Attribute System",
    icon: Hexagon,
    color: "arc-violet",
    sections: [
      {
        heading: "Six Core Attributes",
        content: "Every action you log feeds one or more attributes. Attributes level independently and much faster than your player level.",
        items: [
          "Discipline: Grows from streaks, resisted urges, and habit consistency",
          "Intellect: Fed by study sessions, reading time, and skill mastery",
          "Vitality: Increases with logged workouts, sleep consistency, and recovery",
          "Focus: Builds from deep work sessions and distraction-free time",
          "Social: Strengthened through relationship quests and social activities",
          "Creativity: Nurtured by creative projects, journaling, and exploration",
        ],
      },
      {
        heading: "Attribute Levels & Benefits",
        content: "Each attribute has 100 levels. Higher levels unlock skill tree nodes, improve boss battle damage, and grant passive bonuses to related activities.",
      },
      {
        heading: "Balanced Growth",
        content: "The system rewards balanced progression. Neglecting an attribute creates bottlenecks — some skill nodes require multiple attributes at specific levels to unlock.",
      },
    ],
  },
  {
    title: "Timetable Mastery",
    icon: CalendarClock,
    color: "arc-blue",
    sections: [
      {
        heading: "Three-Tab System",
        content: "The Timetable is your command center for time management, split into three interconnected views.",
        items: [
          "Schedule: Your ideal recurring plan (work hours, gym, study blocks, sleep)",
          "Time Log: Reality — what you actually did today, logged block by block",
          "Analytics: The gap between plan and reality, visualized over 30 days",
        ],
      },
      {
        heading: "Schedule Variants",
        content: "Create multiple schedule templates for different contexts: Office days, Work-from-home, Weekends, Exam period. Switch between them as your week changes.",
      },
      {
        heading: "Logging Reality",
        content: "Each evening (or next morning), fill your Time Log by marking which scheduled blocks actually happened. Matched blocks earn XP and feed streaks. Missed blocks are tracked but not punished — the system learns your real patterns.",
      },
      {
        heading: "The Power of the Gap",
        content: "Analytics shows you where plan and reality diverge. That gap is data, not failure. Use it to spot friction points, unrealistic scheduling, and where to focus your discipline.",
      },
    ],
  },
  {
    title: "Boss Battles Explained",
    icon: Skull,
    color: "arc-red",
    sections: [
      {
        heading: "What Are Bosses?",
        content: "Bosses are multi-day challenges with health bars. They represent sustained effort toward a major goal — finishing a certification, mastering a skill, completing a tough project.",
      },
      {
        heading: "Dealing Damage",
        content: "Your real logged actions deal damage to the boss. Each action tied to the boss's theme chips away at its health. Focus sessions, relevant quests, and milestone progress all count.",
      },
      {
        heading: "Boss Phases",
        content: "Some bosses have multiple phases. As you deplete their health, they evolve — requiring different types of actions or ramping up the difficulty. Defeat all phases to claim victory.",
      },
      {
        heading: "Rewards",
        content: "Defeating a boss grants massive XP, a unique title, and often unlocks new skill tree branches or hidden achievements. Boss victories are permanent milestones in your profile.",
      },
    ],
  },
  {
    title: "Streak System & Shields",
    icon: Flame,
    color: "arc-orange",
    sections: [
      {
        heading: "How Streaks Work",
        content: "A streak counts consecutive perfect days for a specific routine. 'Perfect' means you completed all required blocks in your timetable for that routine category.",
      },
      {
        heading: "Streak Shields",
        content: "Every 7 consecutive perfect days, you earn a Streak Shield. Shields are insurance — if you miss a day, the shield absorbs it and your streak continues. You lose the shield but keep the count.",
      },
      {
        heading: "Multiple Routines",
        content: "You can track independent streaks for different life areas: workout streak, study streak, sleep streak. Each has its own count and shields.",
      },
      {
        heading: "Why Streaks Matter",
        content: "Long streaks unlock bonus XP multipliers, feed your Discipline attribute, and prove consistency over time. The system values the chain, not the intensity of any single day.",
      },
    ],
  },
  {
    title: "Shadow Habits & Recovery",
    icon: EyeOff,
    color: "arc-slate",
    sections: [
      {
        heading: "Shadow Habits",
        content: "These are private, encrypted habits you're trying to break — scrolling addictions, junk food, procrastination loops. The system doesn't judge; it counts.",
      },
      {
        heading: "Logging Urges",
        content: "When an urge hits and you resist it, log it immediately. That resistance is a win. The system tracks urges resisted over time as a measure of growing self-control.",
      },
      {
        heading: "Recovery Mode",
        content: "Slipped? Recovery mode turns the slip into training data. You log what happened, why it happened, and commit to a recovery action. Completing recovery adds to your recovery skill score.",
      },
      {
        heading: "No Shame, Just Reps",
        content: "The system treats slips as information, not failure. Recovery is a skill you level up. Discipline isn't avoiding urges — it's handling them when they arrive.",
      },
    ],
  },
];

const SECTIONS: Section[] = [
  {
    group: "Core",
    blurb: "Where you spend most days. Plan the work, do the work, log the work.",
    entries: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard,
        what: "Your status window — level, XP, coins, attributes, and today's snapshot at a glance.",
        how: "Start here every session. It surfaces what needs attention and links you into every other module." },
      { href: "/quests", label: "Daily Quests", icon: Target,
        what: "Small daily objectives generated for you. Resolve them to earn XP, coins, and attribute growth.",
        how: "Check them off as you complete the real action. Fresh quests appear each day automatically." },
      { href: "/main-quests", label: "Main Quests", icon: Swords,
        what: "Your major life goals, broken into stages.",
        how: "Log progress on the current stage. Clearing a stage grants milestone XP and coins." },
      { href: "/focus", label: "Focus Mode", icon: Timer,
        what: "A timer for deep-work sessions. Focused minutes convert into XP and coins.",
        how: "Start a session before real focused work, stop it when you're done. Don't leave it running idle." },
      { href: "/timetable", label: "Timetable", icon: CalendarClock,
        what: "Three tabs: Schedule (your plan), Time Log (what actually happened), and Analytics. XP and streaks reward reality, not the plan.",
        how: "Set your recurring schedule once, then log each block against it daily. The gap between plan and reality is the point." },
    ],
  },
  {
    group: "Progression",
    blurb: "The RPG layer. Everything here grows automatically from the real actions you log elsewhere.",
    entries: [
      { href: "/attributes", label: "Attributes", icon: Hexagon,
        what: "Core stats (like Discipline, Intellect, Vitality). Every real action feeds an attribute.",
        how: "You don't edit these directly — they climb as you log quests, focus, and workouts. They level faster than you do." },
      { href: "/skills", label: "Skill Trees", icon: GitBranch,
        what: "Branching nodes that unlock as you make real progress.",
        how: "Master one node to open the next. Progress is driven by your logged activity." },
      { href: "/bosses", label: "Boss Battles", icon: Skull,
        what: "Major multi-day challenges with a health bar.",
        how: "Your real actions deal the damage. Chip away over days until the boss falls." },
      { href: "/achievements", label: "Achievements", icon: Trophy,
        what: "One-time unlocks for milestones. Some are hidden until discovered.",
        how: "Nothing to click — they fire when you hit the condition. Check back to see what unlocked." },
      { href: "/titles", label: "Titles", icon: Crown,
        what: "Earned through achievements and bosses. Some grant a small XP bonus.",
        how: "Equip one title at a time. Swap freely as you earn more." },
      { href: "/streaks", label: "Streaks", icon: Flame,
        what: "Consecutive perfect days per routine. Earn a Streak Shield every 7 perfect days.",
        how: "Keep the chain alive. A shield automatically absorbs one missed day so a single slip doesn't reset you." },
    ],
  },
  {
    group: "Discipline",
    blurb: "The honest, human side. Track urges, recover from slips, and reward yourself without guilt.",
    entries: [
      { href: "/shadow", label: "Shadow Habits", icon: EyeOff,
        what: "Private tracking for habits you're trying to break. Counts urges resisted.",
        how: "Log an urge when it hits — resisting it is a win the system records. Kept discreet." },
      { href: "/recovery", label: "Recovery", icon: HeartPulse,
        what: "Turns slips into reps. Recovery is a skill you're training, not a punishment.",
        how: "After a slip, run a recovery to get back on track. The system tracks recoveries completed." },
      { href: "/rewards", label: "Reward Shop", icon: Coins,
        what: "Spend coins on real-life rewards, guilt-free. Coins are separate from XP.",
        how: "Coins come from quests, focus, and bosses. Cash them in here for things you actually want." },
    ],
  },
  {
    group: "Insight",
    blurb: "Look back at the data. Metrics, reports, and the AI Guide that reads it all for you.",
    entries: [
      { href: "/analytics", label: "Analytics", icon: BarChart3,
        what: "Transparent metrics over the last 30 days.",
        how: "Use it to spot trends — what's climbing, what's slipping." },
      { href: "/report", label: "Weekly Report", icon: FileText,
        what: "An automatic weekly summary with a life score and next week's objective.",
        how: "Read it at week's end to close one loop and set the next." },
      { href: "/guide", label: "The Guide", icon: Bot,
        what: "The AI core. Reports what your data says — never slogans.",
        how: "Every insight is derived from your own logs. Also reachable from the floating button, bottom-right, anywhere in the app." },
      { href: "/calendar", label: "Calendar", icon: Calendar,
        what: "The last 5 weeks — brightness shows routine completion per day.",
        how: "A quick heatmap read of how consistent you've been." },
      { href: "/activity", label: "Activity Log", icon: History,
        what: "A full timeline of system events and a year-long contribution heatmap.",
        how: "Scroll it to audit exactly what the system recorded and when." },
      { href: "/settings", label: "Settings", icon: Settings,
        what: "Account, alarms, and notification preferences.",
        how: "Configure reminders here so the system nudges you at the right times." },
    ],
  },
];

const STEPS = [
  { n: 1, text: "Open the Dashboard to see your current status and what needs attention today." },
  { n: 2, text: "Set your recurring plan once in Timetable → Schedule (office / WFH / weekend variants)." },
  { n: 3, text: "As the day happens, log reality: check off Daily Quests, run Focus sessions, and fill the Time Log." },
  { n: 4, text: "Watch the RPG layer respond — Attributes, Skills, Streaks, and Bosses all move from what you logged." },
  { n: 5, text: "At week's end, read the Weekly Report and let The Guide tell you what the data says." },
];

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-void-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-arc-blue/[0.08] to-transparent pb-16 pt-12">
        <div className="grid-overlay absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-arc-blue/40 bg-arc-blue/10 shadow-glow">
              <BookOpen className="h-7 w-7 text-arc-blue" />
            </div>
            <div>
              <p className="sys-label">Complete Guide · Field Manual</p>
              <h1 className="font-display text-3xl font-bold text-slate-100">How Arise OS Works</h1>
            </div>
          </div>

          {/* The one idea - Enhanced */}
          <Panel className="border-arc-blue/25 bg-arc-blue/[0.05] p-6 shadow-glow">
            <div className="flex items-start gap-4">
              <Compass className="mt-1 h-6 w-6 shrink-0 text-arc-blue" />
              <div>
                <div className="sys-label mb-2 text-arc-blue">The Core Philosophy</div>
                <p className="mb-3 text-base leading-relaxed text-slate-100">
                  Arise OS turns your real life into an RPG. You <span className="font-semibold text-white">log real actions</span> —
                  study sessions, focus time, workouts, habits — and the game layer (XP, attributes, skills, streaks, bosses) grows
                  from them <span className="font-semibold text-white">automatically</span>.
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  You almost never edit stats by hand. The system only rewards what actually happened. No fantasy stats, no wishful thinking — just reality, gamified.
                </p>
              </div>
            </div>
          </Panel>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-arc-cyan" />
                <span className="sys-label text-arc-cyan">Daily Quests</span>
              </div>
              <p className="text-xs text-slate-400">Small wins that stack</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2">
                <Hexagon className="h-4 w-4 text-arc-violet" />
                <span className="sys-label text-arc-violet">6 Attributes</span>
              </div>
              <p className="text-xs text-slate-400">Auto-leveling stats</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2">
                <Flame className="h-4 w-4 text-arc-orange" />
                <span className="sys-label text-arc-orange">Streaks</span>
              </div>
              <p className="text-xs text-slate-400">Consistency rewards</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2">
                <Bot className="h-4 w-4 text-arc-violet" />
                <span className="sys-label text-arc-violet">AI Guide</span>
              </div>
              <p className="text-xs text-slate-400">Reads your data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        {/* The core loop */}
        <Panel>
          <PanelHeader
            label="Getting started"
            title="The Core Loop"
            right={<Repeat className="mr-4 mt-1 h-5 w-5 text-slate-500" />}
          />
          <div className="grid gap-3 p-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-4 rounded-lg border border-white/[0.08] bg-gradient-to-r from-white/[0.03] to-transparent p-4 transition hover:border-arc-blue/30">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-arc-blue/40 bg-arc-blue/10 font-display text-sm font-bold text-arc-blue">
                  {s.n}
                </div>
                <p className="pt-1 text-sm leading-relaxed text-slate-200">{s.text}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Detailed Guides */}
        <div>
          <div className="mb-4 flex items-center gap-2 px-1">
            <Brain className="h-5 w-5 text-arc-violet" />
            <h2 className="font-display text-xl font-bold text-slate-100">Deep Dives</h2>
          </div>
          <p className="mb-6 px-1 text-sm text-slate-400">
            Master the core systems. Each guide explains the mechanics, strategy, and why it matters.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {DETAILED_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <Panel key={guide.title} className="p-0">
                  <div className={`border-b border-white/[0.08] bg-${guide.color}/[0.05] p-5`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-${guide.color}/40 bg-${guide.color}/10`}>
                        <Icon className={`h-5 w-5 text-${guide.color}`} />
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-100">{guide.title}</h3>
                    </div>
                  </div>
                  <div className="space-y-4 p-5">
                    {guide.sections.map((section, idx) => (
                      <div key={idx}>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-arc-cyan" />
                          {section.heading}
                        </h4>
                        <p className="mb-2 text-xs leading-relaxed text-slate-400">{section.content}</p>
                        {section.items && (
                          <ul className="space-y-1.5 pl-5">
                            {section.items.map((item, i) => (
                              <li key={i} className="text-xs text-slate-500">
                                <span className="mr-2 text-arc-blue">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* Module reference, grouped like the sidebar */}
        <div>
          <div className="mb-4 flex items-center gap-2 px-1">
            <LayoutDashboard className="h-5 w-5 text-arc-blue" />
            <h2 className="font-display text-xl font-bold text-slate-100">Module Reference</h2>
          </div>
          <p className="mb-6 px-1 text-sm text-slate-400">
            Every module in the sidebar, organized by category. Tap any card to jump directly to that module.
          </p>
          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.group}>
                <div className="mb-4 px-1">
                  <h3 className="font-display text-lg font-semibold text-slate-100">{section.group}</h3>
                  <p className="mt-1 text-sm text-slate-500">{section.blurb}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.entries.map((e) => {
                    const Icon = e.icon;
                    return (
                      <Link key={e.href} href={e.href} className="group">
                        <Panel className="h-full p-4 transition hover:border-arc-blue/40 hover:bg-white/[0.04] hover:shadow-glow">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-arc-blue/30 bg-arc-blue/10">
                              <Icon className="h-4 w-4 text-arc-blue" />
                            </div>
                            <span className="font-display text-sm font-semibold text-slate-100">{e.label}</span>
                            <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-arc-blue" />
                          </div>
                          <p className="mb-2 text-sm leading-snug text-slate-300">{e.what}</p>
                          <p className="text-xs leading-relaxed text-slate-500">
                            <span className="font-medium text-slate-400">How:</span> {e.how}
                          </p>
                        </Panel>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <Panel className="border-arc-cyan/20 bg-arc-cyan/[0.03]">
          <div className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-arc-cyan" />
              <h3 className="font-display text-base font-semibold text-slate-100">Pro Tips</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-arc-cyan" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Start Small</p>
                  <p className="text-xs text-slate-400">Build one routine first, get it consistent, then add more. The system rewards depth over breadth.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-arc-cyan" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Trust the Shields</p>
                  <p className="text-xs text-slate-400">Streak Shields exist so you can miss a day without panic. Use them guilt-free when life happens.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-arc-cyan" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Log Daily</p>
                  <p className="text-xs text-slate-400">Fill your Time Log every evening. The system can't reward reality if you don't record it.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-arc-cyan" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Ask The Guide</p>
                  <p className="text-xs text-slate-400">Stuck or curious? The AI Guide reads your entire history and gives you personalized next steps.</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Footer nudge */}
        <Panel className="border-arc-violet/20 bg-arc-violet/[0.04] p-5">
          <div className="flex items-start gap-4">
            <Bot className="mt-0.5 h-6 w-6 shrink-0 text-arc-violet" />
            <div>
              <p className="mb-2 font-display text-sm font-semibold text-slate-100">Ready to Start?</p>
              <p className="text-sm leading-relaxed text-slate-300">
                Open <Link href="/guide" className="font-medium text-arc-violet underline-offset-2 hover:underline">The Guide</Link> for personalized onboarding,
                or jump straight to the <Link href="/" className="font-medium text-arc-violet underline-offset-2 hover:underline">Dashboard</Link> to see your current status.
                The system learns as you log — there's no wrong starting point.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
