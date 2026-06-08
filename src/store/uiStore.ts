import { create } from 'zustand';
import type { TimeOfDay, CampusState, PigeonBubble } from '../types';
import { getTimeOfDay, getCampusState, usePigeonStore } from './pigeonStore';

export type AppScreen = 'home' | 'map';

interface UIState {
  currentScreen: AppScreen;
  bottomSheet: 'journal' | 'newspaper' | 'collection' | 'mailbox' | string | null;
  feedDockExpanded: boolean;
  sidePanelOpen: boolean;
  sidePanelTab: 'photos' | 'messages' | 'mood' | 'journal' | 'observe' | 'stats';
  activeFeedAnimation: { itemId: string; emoji: string; x: number; y: number } | null;
  pigeonBubble: PigeonBubble | null;
  idleMode: boolean;
  lastTouchTimestamp: number;
  timeOfDay: TimeOfDay;
  campusState: CampusState;
  rippleEffects: { id: string; x: number; y: number }[];

  setScreen: (screen: AppScreen) => void;
  openBottomSheet: (tab: string) => void;
  closeBottomSheet: () => void;
  toggleFeedDock: () => void;
  toggleSidePanel: () => void;
  setSidePanelTab: (tab: 'photos' | 'messages' | 'mood' | 'journal' | 'observe' | 'stats') => void;
  setActiveFeedAnimation: (anim: { itemId: string; emoji: string; x: number; y: number } | null) => void;
  setPigeonBubble: (bubble: { text: string; emoji: string } | null) => void;
  touchDetected: () => void;
  updateTimeDerived: () => void;
  addRipple: (x: number, y: number) => void;
  removeRipple: (id: string) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  currentScreen: 'home',
  bottomSheet: null,
  feedDockExpanded: false,
  sidePanelOpen: false,
  sidePanelTab: 'photos',
  activeFeedAnimation: null,
  pigeonBubble: null,
  idleMode: false,
  lastTouchTimestamp: Date.now(),
  timeOfDay: getTimeOfDay(),
  campusState: getCampusState(usePigeonStore.getState().mood),
  rippleEffects: [],

  setScreen: (screen) => set({ currentScreen: screen }),
  openBottomSheet: (tab) => set({ bottomSheet: tab }),
  closeBottomSheet: () => set({ bottomSheet: null }),
  toggleFeedDock: () => set((s) => ({ feedDockExpanded: !s.feedDockExpanded })),
  toggleSidePanel: () => set((s) => ({ sidePanelOpen: !s.sidePanelOpen })),
  setSidePanelTab: (tab) => set({ sidePanelTab: tab }),
  setActiveFeedAnimation: (anim) => set({ activeFeedAnimation: anim }),
  setPigeonBubble: (bubble) => {
    if (bubble) {
      set({ pigeonBubble: { ...bubble, expiresAt: Date.now() + 4000 } });
    } else {
      set({ pigeonBubble: null });
    }
  },

  touchDetected: () => {
    set({ lastTouchTimestamp: Date.now(), idleMode: false });
  },

  updateTimeDerived: () => {
    set({
      timeOfDay: getTimeOfDay(),
      campusState: getCampusState(usePigeonStore.getState().mood),
    });
  },

  addRipple: (x, y) => {
    const id = `ripple-${Date.now()}`;
    set((s) => ({ rippleEffects: [...s.rippleEffects, { id, x, y }] }));
    setTimeout(() => get().removeRipple(id), 600);
  },
  removeRipple: (id) => set((s) => ({ rippleEffects: s.rippleEffects.filter((r) => r.id !== id) })),
}));

// Idle check interval
setInterval(() => {
  const state = useUIStore.getState();
  if (Date.now() - state.lastTouchTimestamp > 180000 && !state.idleMode) {
    useUIStore.setState({ idleMode: true });
  }
}, 30000);
