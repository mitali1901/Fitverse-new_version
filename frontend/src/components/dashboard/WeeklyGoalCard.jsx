import React from 'react';
import { Target } from 'lucide-react';

export default function WeeklyGoalCard({
  currentMinutes = 0,
  targetMinutes = 150,
  percentage = 0
}) {
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const safeCurrent = Math.max(0, currentMinutes || 0);
  const safeTarget = Math.max(1, targetMinutes || 150);
  const remaining = Math.max(0, safeTarget - safeCurrent);

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-9 h-9 rounded-full bg-fitverse-mint flex items-center justify-center text-fitverse-green-success">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-fitverse-dark">Weekly Yoga Goal</h3>
            <p className="text-xs text-fitverse-muted">Reach your weekly practice target</p>
          </div>
        </div>

        {/* Progress Bar Container with Percentage Indicator */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-fitverse-dark">
            <div className="w-full bg-[#F3EBF9] h-3 rounded-full overflow-hidden mr-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fitverse-purple to-[#8346BC] transition-all duration-700 ease-out"
                style={{ width: `${safePercentage}%` }}
              ></div>
            </div>
            <span className="text-fitverse-dark font-bold whitespace-nowrap text-xs">{safePercentage}%</span>
          </div>
        </div>
      </div>

      {/* Footer Goal Status */}
      <div className="mt-4 pt-2 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-fitverse-muted">
        <span>
          <strong className="text-fitverse-dark text-sm">{safeCurrent}</strong> / {safeTarget} min completed
        </span>
        <span>{remaining} min left</span>
      </div>
    </div>
  );
}
