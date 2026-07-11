"use client";

import { create } from "zustand";

interface TripSelectionState {
  currentPrice: number;
  setCurrentPrice: (price: number) => void;
}

export const useTripSelection = create<TripSelectionState>((set) => ({
  currentPrice: 0,
  setCurrentPrice: (price: number) => set({ currentPrice: price }),
}));
