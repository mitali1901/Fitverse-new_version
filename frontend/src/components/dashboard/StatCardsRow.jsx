import React from 'react';
import { Flower2, Dumbbell, Flame, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

function ChangeBadge({ value }) {
  const text = value ?? "+0";
  const isNegative = String(text).trim().startsWith("-");
  const Icon = isNegative ? ArrowDown : ArrowUp;

  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
      isNegative
        ? "text-fitverse-error bg-fitverse-error-light"
        : "text-fitverse-green-success bg-fitverse-mint"
    }`}>
      <Icon className="w-2.5 h-2.5 mr-0.5" />
      {text}
    </span>
  );
}

export default function StatCardsRow({ stats }) {
  const yogaCount = stats?.yoga_sessions?.value ?? 0;
  const yogaChange = stats?.yoga_sessions?.change;
  const activeMinutes = stats?.active_minutes?.value ?? "0 min";
  const minutesChange = stats?.active_minutes?.change;
  const calories = stats?.calories?.value ?? "0 kcal";
  const caloriesChange = stats?.calories?.change;
  const progressPct = Math.min(100, Math.max(0, stats?.overall_progress?.percentage ?? 0));

  // Circular gauge calculation (radius = 28, circumference = 2 * PI * 28 ≈ 175.9)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Yoga Sessions */}
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-5 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple shrink-0">
            <Flower2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fitverse-muted">Yoga Sessions</p>
            <h4 className="text-2xl font-black text-fitverse-dark tracking-tight">{yogaCount}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-fitverse-muted">This Week</span>
              <ChangeBadge value={yogaChange} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Minutes */}
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-5 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-fitverse-mint flex items-center justify-center text-fitverse-green-success shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fitverse-muted">Active Minutes</p>
            <h4 className="text-2xl font-black text-fitverse-dark tracking-tight">{activeMinutes}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-fitverse-muted">This Week</span>
              <ChangeBadge value={minutesChange} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Calories (Est.) */}
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-5 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-fitverse-peach flex items-center justify-center text-orange-500 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fitverse-muted">Calories (Est.)</p>
            <h4 className="text-2xl font-black text-fitverse-dark tracking-tight">{calories}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-fitverse-muted">This Week</span>
              <ChangeBadge value={caloriesChange} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Your Progress */}
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-5 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-fitverse-mint flex items-center justify-center text-fitverse-green-success">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-fitverse-dark">Your Progress</p>
          </div>
          <p className="text-[11px] text-fitverse-muted mt-2">Weekly goal completion rate</p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 68 68">
            {/* Background Track */}
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke="#F2E8FA"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Foreground Arc */}
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke="#A875D5"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-fitverse-dark font-['Outfit']">{progressPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
