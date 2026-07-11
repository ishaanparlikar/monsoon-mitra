'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Family, FamilyMember, PreparednessPlan, ChecklistItem, WeatherAlert, Shelter, EvacuationRoute, PlanWithChecklist } from '@/types';

interface AppContextType {
  language: string;
  setLanguage: (lang: string) => void;
  family: Family | null;
  setFamily: (family: Family) => void;
  members: FamilyMember[];
  setMembers: (members: FamilyMember[]) => void;
  alerts: WeatherAlert[];
  setAlerts: (alerts: WeatherAlert[]) => void;
  plan: PlanWithChecklist | null;
  setPlan: (plan: PlanWithChecklist) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  refreshPlan: () => Promise<void>;
  updateChecklistItem: (itemId: string, isCompleted: boolean) => void;
  shelters: Shelter[];
  setShelters: (shelters: Shelter[]) => void;
  routes: EvacuationRoute[];
  setRoutes: (routes: EvacuationRoute[]) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [plan, setPlan] = useState<PlanWithChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const refreshPlan = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implement actual plan refresh from API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChecklistItem = useCallback((itemId: string, isCompleted: boolean) => {
    setPlan(prev => {
      if (!prev) return null;
      const items = (prev as PlanWithChecklist).checklistItems || [];
      return {
        ...prev,
        checklistItems: items.map(item =>
          item.id === itemId ? { ...item, isCompleted } : item
        ),
      } as PlanWithChecklist;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        family,
        setFamily,
        members,
        setMembers,
        alerts,
        setAlerts,
        plan,
        setPlan,
        loading,
        setLoading,
        refreshPlan,
        updateChecklistItem,
        shelters,
        setShelters,
        routes,
        setRoutes,
        isOnline,
        setIsOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}