import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIConfig } from "@/types";

interface SettingsStore {
  apiConfig: APIConfig;
  setApiConfig: (config: Partial<APIConfig>) => void;
  resetApiConfig: () => void;
}

const DEFAULT_API_CONFIG: APIConfig = {
  apiKey: "",
  apiEndpoint: "",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      apiConfig: DEFAULT_API_CONFIG,

      setApiConfig: (config: Partial<APIConfig>) => {
        set((state) => ({
          apiConfig: { ...state.apiConfig, ...config },
        }));
      },

      resetApiConfig: () => {
        set({ apiConfig: DEFAULT_API_CONFIG });
      },
    }),
    {
      name: "node-banana-settings",
    }
  )
);
