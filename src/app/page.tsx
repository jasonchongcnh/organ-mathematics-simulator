"use client";

import { useState } from "react";

import { BottomControls } from "@/components/BottomControls";
import { SimulationSurface } from "@/components/SimulationSurface";
import type { TwoDimensionalKinematics, TwoDimensionalParameters } from "@/types/origami";

function calculateKinematics(
  parameters: TwoDimensionalParameters
): TwoDimensionalKinematics {
  const derivedLinkLength = 0.25 * (parameters.s1 + parameters.s2);
  const theta = 2 * Math.atan((parameters.s1 - parameters.s2) / (4 * parameters.r));
  const endEffectorX = -derivedLinkLength * Math.sin(theta);
  const endEffectorY = derivedLinkLength + derivedLinkLength * Math.cos(theta);

  return {
    ...parameters,
    linkLength: derivedLinkLength,
    derivedLinkLength,
    theta,
    thetaDegrees: theta * (180 / Math.PI),
    endEffectorX,
    endEffectorY,
  };
}

export default function Home() {
  const [parameters, setParameters] = useState<TwoDimensionalParameters>({
    s1: 360,
    s2: 240,
    r: 32,
    linkLength: 150,
  });
  const kinematics = calculateKinematics(parameters);

  const updateParameter = (
    key: keyof TwoDimensionalParameters,
    value: number
  ) => {
    setParameters((current) => {
      if (key === "linkLength") {
        const difference = current.s1 - current.s2;
        const sum = value * 4;
        const nextS1 = Math.min(520, Math.max(80, (sum + difference) / 2));
        const nextS2 = Math.min(520, Math.max(80, (sum - difference) / 2));

        return {
          ...current,
          s1: nextS1,
          s2: nextS2,
          linkLength: 0.25 * (nextS1 + nextS2),
        };
      }

      const next = {
        ...current,
        [key]: value,
      };

      if (key === "s1" || key === "s2") {
        return {
          ...next,
          linkLength: 0.25 * (next.s1 + next.s2),
        };
      }

      return next;
    });
  };

  return (
    <main className="relative h-screen min-h-[620px] w-full overflow-hidden bg-[#f6f7f7]">
      <SimulationSurface
        parameters={parameters}
        kinematics={kinematics}
      />
      <BottomControls
        parameters={parameters}
        kinematics={kinematics}
        onParameterChange={updateParameter}
      />
    </main>
  );
}
