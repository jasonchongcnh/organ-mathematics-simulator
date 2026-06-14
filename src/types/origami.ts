export type ViewMode = "material" | "strain";

export type ControlMode = "rotate" | "grab";

export type FoldPreset = 0 | 25 | 50 | 75 | 100;

export type OrigamiSimulatorState = {
  foldPercent: number;
  viewMode: ViewMode;
  controlMode: ControlMode;
  advancedOpen: boolean;
};

export type TwoDimensionalParameters = {
  s1: number;
  s2: number;
  r: number;
  linkLength: number;
};

export type TwoDimensionalKinematics = TwoDimensionalParameters & {
  derivedLinkLength: number;
  theta: number;
  thetaDegrees: number;
  endEffectorX: number;
  endEffectorY: number;
};

export type OrigamiControlProps = {
  foldPercent: number;
  viewMode: ViewMode;
  controlMode: ControlMode;
  advancedOpen?: boolean;
  onFoldPercentChange?: (foldPercent: number) => void;
  onViewModeChange?: (viewMode: ViewMode) => void;
  onControlModeChange?: (controlMode: ControlMode) => void;
  onAdvancedOpenChange?: (advancedOpen: boolean) => void;
};

export type TwoDimensionalControlProps = {
  parameters: TwoDimensionalParameters;
  kinematics: TwoDimensionalKinematics;
  advancedOpen?: boolean;
  onParameterChange?: (key: keyof TwoDimensionalParameters, value: number) => void;
  onAdvancedOpenChange?: (advancedOpen: boolean) => void;
};

export type MenuItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: "about" | "tips";
  children?: MenuItem[];
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};
