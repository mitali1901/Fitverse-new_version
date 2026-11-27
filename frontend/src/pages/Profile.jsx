import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYoga } from '../context/YogaContext';
import { User, Mail, Award, Clock, Flame, Target, Save, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { dashboardData, refreshSummary } = useYoga();

  const [name, setName] = useState(user?.name || "Ananya Sharma");
  const [weeklyGoal, setWeeklyGoal] = useState(user?.weekly_goal_minutes || 150);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.weekly_goal_minutes) setWeeklyGoal(user.weekly_goal_minutes);
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const res = await api.put('/users/profile', {
        name,
        weekly_goal_minutes: Number(weeklyGoal)
      });
      if (res.data.success) {
        setUser(res.data.user);
        setUpdateSuccess(true);
        refreshSummary();
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalSessions = dashboardData?.total_lifetime_sessions ?? 0;
  const activeMinutes = dashboardData?.stats?.active_minutes?.value ?? "0 min";
  const avgScore = dashboardData?.average_lifetime_score ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-8 shadow-card flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full border-4 border-fitverse-lavender overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-tr from-fitverse-purple to-[#B88EE0] text-white text-3xl font-black font-['Outfit'] select-none">
          {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AS'}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-black text-fitverse-dark tracking-tight">{name}</h2>
          <p className="text-sm text-fitverse-muted flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
            <Mail className="w-4 h-4 text-fitverse-purple" />
            {user?.email || "ananya@fitverse.com"}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
            <span className="text-xs px-3 py-1 rounded-full bg-fitverse-lavender text-fitverse-purple font-bold">
              Yoga Enthusiast
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-fitverse-mint text-fitverse-green-success font-bold">
              Level 1 Practitioner
            </span>
          </div>
        </div>
      </div>

      {/* Fitness Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fitverse-muted">Total Sessions</p>
            <h4 className="text-2xl font-black text-fitverse-dark font-['Outfit']">{totalSessions}</h4>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-fitverse-mint flex items-center justify-center text-fitverse-green-success">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fitverse-muted">Active Minutes</p>
            <h4 className="text-2xl font-black text-fitverse-dark font-['Outfit']">{activeMinutes}</h4>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-fitverse-peach flex items-center justify-center text-orange-500">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fitverse-muted">Average Alignment</p>
            <h4 className="text-2xl font-black text-fitverse-dark font-['Outfit']">{avgScore}%</h4>
          </div>
        </div>
      </div>

      {/* Account Settings Form */}
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-8 shadow-card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-lg text-fitverse-dark">Fitness Goals & Profile Settings</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF6FD] border border-[#E9D6F7] rounded-2xl px-4 py-3 text-sm text-fitverse-dark focus:outline-none focus:border-fitverse-purple"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Weekly Goal (Minutes)</label>
              <input
                type="number"
                min="30"
                max="600"
                step="15"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                className="w-full bg-[#FAF6FD] border border-[#E9D6F7] rounded-2xl px-4 py-3 text-sm text-fitverse-dark focus:outline-none focus:border-fitverse-purple"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {updateSuccess ? (
              <span className="text-xs font-bold text-fitverse-green-success flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Profile updated successfully!
              </span>
            ) : (
              <span className="text-xs text-fitverse-muted">Changes reflect across your dashboard immediately.</span>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="py-3 px-6 rounded-2xl bg-fitverse-purple hover:bg-[#975fc3] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

