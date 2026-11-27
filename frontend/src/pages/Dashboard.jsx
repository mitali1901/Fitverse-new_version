import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYoga } from '../context/YogaContext';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import WeeklyGoalCard from '../components/dashboard/WeeklyGoalCard';
import StatCardsRow from '../components/dashboard/StatCardsRow';
import WeeklyActivityChart from '../components/dashboard/WeeklyActivityChart';
import RecentSessionsList from '../components/dashboard/RecentSessionsList';
import AICoachCard from '../components/dashboard/AICoachCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { dashboardData, refreshSummary } = useYoga();

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const data = dashboardData;
  const userName = user?.name ? user.name.split(' ')[0] : 'Yogi';
  const weeklyGoal = data?.weekly_goal || {
    target_minutes: 150,
    current_minutes: 0,
    progress_percentage: 0
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Welcome Banner (Left) + Weekly Goal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WelcomeBanner userName={userName} />
        </div>
        <div className="lg:col-span-1">
          <WeeklyGoalCard
            currentMinutes={weeklyGoal.current_minutes}
            targetMinutes={weeklyGoal.target_minutes}
            percentage={weeklyGoal.progress_percentage}
          />
        </div>
      </div>

      {/* Row of 4 Stat Cards */}
      <StatCardsRow stats={data?.stats} />

      {/* Bottom Section: Weekly Activity (Left) + Recent Sessions (Middle) + AI Coach (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WeeklyActivityChart data={data?.weekly_activity} />
        <RecentSessionsList sessions={data?.recent_sessions} />
        <AICoachCard />
      </div>
    </div>
  );
}

