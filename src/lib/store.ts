import { create } from 'zustand';

interface WorkbenchState {
  sidebarOpen: boolean;
  activeProjectId: string | null;
  toggleSidebar: () => void;
  setActiveProject: (id: string | null) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  sidebarOpen: true,
  activeProjectId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveProject: (id) => set({ activeProjectId: id }),
}));
