import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle } from 'lucide-react';

const POSE_CALORIES = {
  "warrior_ii": 50, // calories per 5 min session
  "tree_pose": 35,
  "downward_dog": 45,
  "mountain_pose": 30,
  "chair_pose": 55,
  "plank_pose": 60,
  "cobra_pose": 35,
  "bridge_pose": 50,
  "seated_forward_bend": 30,
  "cat_cow_pose": 35
};

const PLANNER_POSE_IDS = [
  "warrior_ii",
  "tree_pose",
  "downward_dog",
  "mountain_pose",
  "chair_pose",
  "plank_pose",
  "cobra_pose",
  "bridge_pose",
  "seated_forward_bend",
  "cat_cow_pose"
];

export default function PosePlannerModal({ isOpen, onClose, poses, onSelectPose, onStartSession }) {
  const [completedPoses, setCompletedPoses] = useState({});
  const [completionDates, setCompletionDates] = useState({});

  // Load completed poses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fitverse_completed_poses');
    if (saved) {
      setCompletedPoses(JSON.parse(saved));
    }
    const savedDates = localStorage.getItem('fitverse_pose_completion_dates');
    if (savedDates) {
      setCompletionDates(JSON.parse(savedDates));
    }
  }, []);

  // Save completed poses to localStorage
  const togglePoseCompletion = (poseId) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = {
      ...completedPoses,
      [poseId]: !completedPoses[poseId]
    };
    const updatedDates = { ...completionDates };
    if (updated[poseId]) {
      updatedDates[poseId] = today;
    } else {
      delete updatedDates[poseId];
    }

    setCompletedPoses(updated);
    setCompletionDates(updatedDates);
    localStorage.setItem('fitverse_completed_poses', JSON.stringify(updated));
    localStorage.setItem('fitverse_pose_completion_dates', JSON.stringify(updatedDates));

    // Store only today's planner calories/completions for daily tracking
    const dailyCalories = Object.keys(updatedDates).reduce((sum, id) => {
      return sum + (updatedDates[id] === today ? (POSE_CALORIES[id] || 0) : 0);
    }, 0);
    const todayCompletedPoses = Object.keys(updated).reduce((acc, id) => {
      if (updated[id] && updatedDates[id] === today) acc[id] = true;
      return acc;
    }, {});

    const dailyData = JSON.parse(localStorage.getItem('fitverse_daily_data') || '{}');
    dailyData[today] = {
      ...dailyData[today],
      calories: dailyCalories,
      completedPoses: todayCompletedPoses
    };
    localStorage.setItem('fitverse_daily_data', JSON.stringify(dailyData));
  };

  const plannerDays = PLANNER_POSE_IDS.map((poseId, index) => ({
    day: index + 1,
    poseId,
    label: `Day ${index + 1}`
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-[#F0E6F7] shadow-xl max-w-2xl w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-fitverse-dark">10-Day Yoga Planner</h3>
            <p className="text-xs text-fitverse-muted">Complete one pose each day and track your progress</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day-wise Planner */}
        <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
          {plannerDays.map((dayPlan) => {
            const pose = poses.find(p => p.id === dayPlan.poseId);
            const isCompleted = completedPoses[dayPlan.poseId];
            
            if (!pose) return null;

            return (
              <div
                key={dayPlan.day}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isCompleted
                    ? "border-fitverse-green-success bg-[#F0FDF4]"
                    : "border-gray-100 hover:border-[#E8D4F7] hover:bg-[#FCFAFD]"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Day Badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompleted ? 'bg-fitverse-green-success' : 'bg-fitverse-lavender'
                  }`}>
                    <span className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-fitverse-purple'}`}>
                      D{dayPlan.day}
                    </span>
                  </div>

                  {/* Pose Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-fitverse-dark">{pose.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitverse-lavender text-fitverse-purple font-semibold">
                        {pose.difficulty}
                      </span>
                    </div>
                    <p className="text-xs italic text-fitverse-muted">{pose.sanskrit_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-fitverse-dark/70 line-clamp-1">{pose.description}</p>
                      <span className="text-[10px] text-fitverse-muted">
                        ~{POSE_CALORIES[pose.id]} kcal
                      </span>
                    </div>
                  </div>

                  {/* Completion Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePoseCompletion(pose.id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-8 h-8 text-fitverse-green-success" />
                    ) : (
                      <Circle className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Start Practice Button */}
                <button
                  onClick={() => {
                    onSelectPose(pose);
                    if (onStartSession) onStartSession();
                    onClose();
                  }}
                  className="mt-3 w-full py-2 rounded-xl bg-fitverse-purple hover:bg-fitverse-purple-dark text-white text-xs font-bold transition-colors"
                >
                  Start Practice
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-2xl bg-[#FAF5FD] border border-[#F0E6F7]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fitverse-muted">Today's Progress</p>
              <p className="text-sm font-bold text-fitverse-dark mt-0.5">
                {plannerDays.filter((dayPlan) => completedPoses[dayPlan.poseId]).length} / {plannerDays.length} poses completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-fitverse-muted">Calories Burned</p>
              <p className="text-sm font-bold text-fitverse-dark mt-0.5">
                {Object.keys(completedPoses).reduce((sum, id) => {
                  return sum + (completedPoses[id] ? (POSE_CALORIES[id] || 0) : 0);
                }, 0)} kcal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
