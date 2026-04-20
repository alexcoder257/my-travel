"use client";

import { TripDataProvider } from "@/contexts/TripDataContext";
import { ReactNode } from "react";

export default function TripLayout({ children }: { children: ReactNode }) {
  return <TripDataProvider>{children}</TripDataProvider>;
}
