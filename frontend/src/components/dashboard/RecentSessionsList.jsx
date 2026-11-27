import React from 'react';
import { Flower2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecentSessionsList({ sessions = [] }) {
  const navigate = useNavigate();
  const displaySessions = sessions.slice(0, 3);

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
            <Flower2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-fitverse-dark">Recent Yoga Sessions</h3>
        </div>
        <button
          onClick={() => navigate('/studio')}
          className="text-xs font-bold text-fitverse-purple hover:text-fitverse-purple-hover flex items-center gap-1 group transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Sessions Items */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {displaySessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-fitverse-muted">
            No recent sessions yet. Complete a yoga session to see it here.
          </div>
        ) : (
          displaySessions.map((session, index) => {
            const score = session.score ?? 0;
            return (
              <div
                key={session._id || index}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF6FD] transition-colors border border-transparent hover:border-[#F2E8FA]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fitverse-lavender flex items-center justify-center shrink-0">
                    <Flower2 className="w-5 h-5 text-fitverse-purple" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-fitverse-dark">{session.pose_name}</h4>
                    <p className="text-[11px] text-fitverse-muted">
                      {session.date || "Recent"} · {session.duration_formatted || `${Math.round((session.duration || 0) / 60)} min`}
                    </p>
                  </div>
                </div>

                {/* Percentage Green Badge */}
                <div className="px-2.5 py-1 rounded-full bg-fitverse-mint text-fitverse-green-success font-black text-xs">
                  {score}%
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
