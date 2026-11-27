import React from 'react';
import { X, Check } from 'lucide-react';

export default function PoseSelectorModal({ isOpen, onClose, poses, selectedPose, onSelectPose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-[#F0E6F7] shadow-xl max-w-xl w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-fitverse-dark">Select Yoga Pose</h3>
            <p className="text-xs text-fitverse-muted">Choose a posture to practice in AI Yoga Studio</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pose Cards List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {poses.map((pose) => {
            const isSelected = selectedPose?.id === pose.id;
            return (
              <div
                key={pose.id}
                onClick={() => {
                  onSelectPose(pose);
                  onClose();
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-fitverse-purple bg-[#FAF5FD]"
                    : "border-gray-100 hover:border-[#E8D4F7] hover:bg-[#FCFAFD]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-fitverse-lavender flex items-center justify-center overflow-hidden shrink-0 p-1">
                    <img
                      src={pose.image || "/assets/warrior_pose.svg"}
                      alt={pose.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-fitverse-dark">{pose.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitverse-lavender text-fitverse-purple font-semibold">
                        {pose.difficulty}
                      </span>
                    </div>
                    <p className="text-xs italic text-fitverse-muted">{pose.sanskrit_name}</p>
                    <p className="text-xs text-fitverse-dark/70 mt-1 line-clamp-1">{pose.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-7 h-7 rounded-full bg-fitverse-purple text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

