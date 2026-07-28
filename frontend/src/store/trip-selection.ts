"use client";

import { create } from "zustand";

interface TripSelectionState {
  currentPrice: number;
  setCurrentPrice: (price: number) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
}

export const useTripSelection = create<TripSelectionState>((set) => ({
  currentPrice: 0,
  setCurrentPrice: (price: number) => set({ currentPrice: price }),
  selectedDate: null,
  setSelectedDate: (date: string | null) => set({ selectedDate: date }),
}));
