"use client";

import { MRT_LINES, MRTStep } from "@/lib/mrt";
import { MoveRight, Footprints } from "lucide-react";

export function MRTVisualizer({ steps }: { steps: MRTStep[] }) {
  return (
    <div className="mt-3 flex flex-col gap-3 py-2">
      <div className="flex items-center flex-wrap gap-y-4">
        {steps.map((step, index) => {
          const lineInfo = step.line ? MRT_LINES[step.line] : null;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm flex items-center justify-center min-w-[32px] mb-1.5"
                  style={{
                    backgroundColor: lineInfo?.color || "var(--nature-600)",
                    color: "#ffffff"
                  }}
                >
                  {step.line || (step.type === "walk" ? "WALK" : "MRT")}
                </div>
                <div className="h-[28px] flex items-start justify-center">
                  <span className="text-[10px] font-bold text-center max-w-[64px] leading-[1.1] line-clamp-2 break-words" style={{ color: "var(--nature-800)" }}>
                    {step.station}
                  </span>
                </div>
              </div>

              {!isLast && (
                <div className="px-1 flex flex-col items-center self-start mt-2">
                  <div className="flex items-center">
                    {steps[index + 1].type === "walk" ? (
                      <div className="flex items-center gap-1 px-1">
                        <div className="h-[2px] w-2 bg-orange-200" />
                        <Footprints className="w-3 h-3 text-orange-400 animate-pulse" />
                        <div className="h-[2px] w-2 bg-orange-200" />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="h-[3px] w-3" style={{ backgroundColor: lineInfo?.color || "var(--nature-600)" }} />
                        <MoveRight className="w-3 h-3 mx-0.5" style={{ color: lineInfo?.color || "var(--nature-600)" }} />
                        <div className="h-[3px] w-3" style={{ backgroundColor: MRT_LINES[steps[index+1].line || ""]?.color || lineInfo?.color || "var(--nature-600)" }} />
                      </div>
                    )}
                  </div>
                  {step.type === "transfer" && (
                    <span className="text-[8px] font-bold text-orange-500 mt-1 uppercase whitespace-nowrap">Transfer</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
