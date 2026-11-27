import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { yogaService } from '../services/yogaService';

const YogaContext = createContext(null);

export function YogaProvider({ children }) {
  const [poses, setPoses] = useState([]);
  const [selectedPose, setSelectedPose] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const poseList = await yogaService.getPoses();
        setPoses(poseList || []);
        if (poseList && poseList.length > 0) {
          // Default to Warrior II Pose matching the reference image Screen 2
          const defaultPose = poseList.find(p => p.id === 'warrior_ii') || poseList[0];
          setSelectedPose(defaultPose);
        }
      } catch (err) {
        console.error("Failed to load poses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const summary = await yogaService.getSummary();
      setDashboardData(summary);
      return summary;
    } catch (err) {
      console.warn("Summary fetch error:", err);
      return null;
    }
  }, []);

  const recordSession = useCallback(async (sessionData) => {
    try {
      const res = await yogaService.createSession(sessionData);
      await refreshSummary();
      return res;
    } catch (err) {
      console.error("Record session error:", err);
      throw err;
    }
  }, [refreshSummary]);

  return (
    <YogaContext.Provider value={{
      poses,
      selectedPose,
      setSelectedPose,
      dashboardData,
      refreshSummary,
      recordSession,
      loading
    }}>
      {children}
    </YogaContext.Provider>
  );
}

export function useYoga() {
  const context = useContext(YogaContext);
  if (!context) {
    throw new Error("useYoga must be used within a YogaProvider");
  }
  return context;
}

