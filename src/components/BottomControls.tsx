"use client";

import type {
  TwoDimensionalControlProps,
  TwoDimensionalParameters,
} from "@/types/origami";

const compactControls: Array<{
  key: keyof TwoDimensionalParameters;
  label: string;
  min: number;
  max: number;
}> = [
  { key: "s1", label: "S1", min: 80, max: 520 },
  { key: "s2", label: "S2", min: 80, max: 520 },
  { key: "r", label: "r", min: 8, max: 80 },
  { key: "linkLength", label: "L", min: 40, max: 260 },
];

export function BottomControls({
  parameters,
  kinematics,
  onParameterChange,
}: Pick<
  TwoDimensionalControlProps,
  "parameters" | "kinematics" | "onParameterChange"
>) {
  const getControlValue = (key: keyof TwoDimensionalParameters) =>
    key === "linkLength" ? kinematics.derivedLinkLength : parameters[key];

  return (
    <div
      id="controlsBottom"
      className="z-20 w-[760px] max-w-[calc(100vw-24px)] rounded-[8px] border border-[#34495e]/30 bg-white/90 px-4 pb-8 pt-4 text-[#34495e] shadow-[0_10px_28px_rgba(52,73,94,0.18)] backdrop-blur sm:px-5"
    >
      <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {compactControls.map((control) => (
          <label
            key={control.key}
            className="min-w-0 text-center text-sm font-black"
          >
            <span className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <span>{control.label}</span>
              <span className="truncate tabular-nums">
                {getControlValue(control.key).toFixed(0)} mm
              </span>
            </span>
            <input
              type="range"
              aria-label={control.label}
              min={control.min}
              max={control.max}
              step={1}
              value={getControlValue(control.key)}
              onInput={(event) =>
                onParameterChange?.(control.key, event.currentTarget.valueAsNumber)
              }
              onChange={(event) =>
                onParameterChange?.(control.key, event.currentTarget.valueAsNumber)
              }
              className="h-2 w-full accent-[#34495e]"
            />
          </label>
        ))}
      </div>
      <div className="absolute bottom-[8px] left-0 right-0 text-center text-xs font-semibold text-[#526579]">
        theta {kinematics.thetaDegrees.toFixed(1)} deg · x{" "}
        {kinematics.endEffectorX.toFixed(1)} mm · y {kinematics.endEffectorY.toFixed(1)} mm
      </div>
    </div>
  );
}
