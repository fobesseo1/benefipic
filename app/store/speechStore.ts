import { create } from 'zustand';

interface SpeechStore {
  showSpeechAnalyzer: boolean;
  highlightSpeechAnalyzer: boolean;
  setSpeechAnalyzer: (show: boolean, highlight: boolean) => void;
  resetSpeechAnalyzer: () => void;
}

export const useSpeechStore = create<SpeechStore>((set) => ({
  showSpeechAnalyzer: false,
  highlightSpeechAnalyzer: false,
  setSpeechAnalyzer: (show, highlight) =>
    set({
      showSpeechAnalyzer: show,
      highlightSpeechAnalyzer: highlight,
    }),
  resetSpeechAnalyzer: () =>
    set({
      showSpeechAnalyzer: false,
      highlightSpeechAnalyzer: false,
    }),
}));
