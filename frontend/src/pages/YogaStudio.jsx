import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYoga } from '../context/YogaContext';
import StudioVideoView from '../components/yoga/StudioVideoView';
import RealTimeFeedbackPanel from '../components/yoga/RealTimeFeedbackPanel';
import AlignmentScoreGauge from '../components/yoga/AlignmentScoreGauge';
import SessionTimerControls from '../components/yoga/SessionTimerControls';
import PosePlannerModal from '../components/yoga/PosePlannerModal';
import SessionSummaryModal from '../components/yoga/SessionSummaryModal';
import PhotoAnalysisModal from '../components/yoga/PhotoAnalysisModal';
import { Flower2, ChevronRight } from 'lucide-react';

export default function YogaStudio() {
  const navigate = useNavigate();
  const { poses, selectedPose, setSelectedPose, recordSession } = useYoga();

  // Pose selection modal state
  const [isPoseModalOpen, setIsPoseModalOpen] = useState(false);
  // Photo upload modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  // Session summary modal state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Live evaluation state updated from StudioVideoView
  const [currentEvaluation, setCurrentEvaluation] = useState(null);

  // Session timer state
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(300);   // 05:00
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Aggregated session statistics (accumulated live during active practice)
  const scoreHistoryRef = useRef([]);
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    averageScore: 0,
    bestScore: 0,
    correctionCount: 0,
  });

  // Timer interval effect
  useEffect(() => {
    let interval = null;
    if (isSessionActive && !isPaused) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => {
          const next = prev + 1;
          if (next >= targetSeconds) {
            // Reached target
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, isPaused, targetSeconds]);

  // Handle evaluation updates from pose detection engine
  const handleEvaluationUpdate = useCallback((evalResult) => {
    setCurrentEvaluation(evalResult);
    // Only record scores when user is actually in the pose (score > 0)
    if (evalResult?.alignmentScore && evalResult.alignmentScore > 0) {
      scoreHistoryRef.current.push(evalResult.alignmentScore);
      if (scoreHistoryRef.current.length > 30) {
        scoreHistoryRef.current.shift();
      }
    }
  }, []);

  // Session Controls
  const handleStartSession = () => {
    if (!isSessionActive) {
      setSessionSeconds(0);
      scoreHistoryRef.current = [];
    }
    setIsSessionActive(true);
    setIsPaused(false);
  };

  const handlePauseSession = () => {
    setIsPaused((prev) => !prev);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setIsPaused(false);

    // Calculate aggregated stats
    const scores = scoreHistoryRef.current.length > 0 ? scoreHistoryRef.current : [0];
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const stats = {
      duration: sessionSeconds,
      averageScore: avg,
      bestScore: best,
      correctionCount: currentEvaluation?.feedbackList?.filter((f) => f.isWarning).length || 2,
    };
    setSessionStats(stats);
    setIsSummaryModalOpen(true);
  };

  // Save session to backend and localStorage
  const handleSaveSession = async () => {
    // Save to backend
    await recordSession({
      pose_name: selectedPose?.name || "Warrior II Pose",
      duration: sessionStats.duration,
      average_alignment_score: sessionStats.averageScore,
      best_alignment_score: sessionStats.bestScore,
      correction_count: sessionStats.correctionCount,
      notes: "Studio Live Practice"
    });

    // Save to localStorage for dashboard
    const sessionData = JSON.parse(localStorage.getItem('fitverse_sessions') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    sessionData.push({
      date: today,
      pose_name: selectedPose?.name || "Warrior II Pose",
      duration: sessionStats.duration,
      average_alignment_score: sessionStats.averageScore,
      best_alignment_score: sessionStats.bestScore,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('fitverse_sessions', JSON.stringify(sessionData));
  };

  const currentPoseName = selectedPose?.name || "Warrior II Pose";
  const currentSanskritName = selectedPose?.sanskrit_name || "Virabhadrasana II";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Preview + Live Skeleton Overlay (Cols 7 of 12) */}
        <div className="lg:col-span-7">
          <StudioVideoView
            selectedPose={selectedPose}
            onEvaluationUpdate={handleEvaluationUpdate}
            isSessionActive={isSessionActive}
          />
        </div>

        {/* Right Column: Pose Info, Feedback, Gauge, Timers, Buttons (Cols 5 of 12) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Pose Header Card matching reference image */}
          <div
            onClick={() => setIsPoseModalOpen(true)}
            className="bg-white rounded-3xl border border-[#F0E6F7] p-4 shadow-card flex items-center justify-between hover:border-fitverse-purple/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-fitverse-mint flex items-center justify-center text-fitverse-green-success shrink-0">
                <Flower2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-fitverse-muted">Current Pose</p>
                <h3 className="font-extrabold text-base text-fitverse-dark group-hover:text-fitverse-purple transition-colors">
                  {currentPoseName}
                </h3>
                <p className="text-xs text-fitverse-muted italic">({currentSanskritName})</p>
              </div>
            </div>

            {/* Thumbnail on right with vector SVG pose icon */}
            <div className="flex items-center gap-2">
              <div className="w-14 h-12 rounded-xl bg-fitverse-lavender overflow-hidden border border-purple-100 flex items-center justify-center p-1">
                <img
                  src={selectedPose?.image || "/assets/warrior_pose.svg"}
                  alt={currentPoseName}
                  className="w-full h-full object-contain"
                />
              </div>
              <ChevronRight className="w-4 h-4 text-fitverse-muted group-hover:text-fitverse-purple group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Real-time Feedback & Alignment Score Row matching reference image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RealTimeFeedbackPanel
              feedbackList={currentEvaluation?.feedbackList}
            />
            <AlignmentScoreGauge
              score={currentEvaluation?.alignmentScore ?? 78}
              statusText={currentEvaluation?.statusText ?? "Good Alignment"}
            />
          </div>

          {/* Session Timer & Action Controls matching reference image */}
          <SessionTimerControls
            sessionSeconds={sessionSeconds}
            targetSeconds={targetSeconds}
            isActive={isSessionActive}
            isPaused={isPaused}
            onStart={handleStartSession}
            onPause={handlePauseSession}
            onEnd={handleEndSession}
            onOpenUpload={() => setIsPhotoModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <PosePlannerModal
        isOpen={isPoseModalOpen}
        onClose={() => setIsPoseModalOpen(false)}
        poses={poses}
        onSelectPose={setSelectedPose}
        onStartSession={handleStartSession}
      />

      <SessionSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        sessionStats={sessionStats}
        selectedPose={selectedPose}
        onSaveSession={handleSaveSession}
        onSuccessNavigate={() => navigate('/')}
      />

      <PhotoAnalysisModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
      />
    </div>
  );
}
