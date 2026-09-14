export type TemperatureUnit = "C" | "F" | "K";

export interface Temperature {
  value: number;
  unit: TemperatureUnit;
}

export type ConversionResult =
  | { success: true; temperature: Temperature }
  | { success: false; error: string };

export interface ParsedInput {
  value: number;
  fromUnit: TemperatureUnit;
  toUnit: TemperatureUnit;
}

export type ValidationResult =
  | { valid: true; data: ParsedInput }
  | { valid: false; error: string };

export const UNIT_NAMES: Record<TemperatureUnit, string> = {
  C: "Celsius",
  F: "Fahrenheit",
  K: "Kelvin",
};

export const UNIT_SYMBOLS: Record<TemperatureUnit, string> = {
  C: "°C",
  F: "°F",
  K: "K",
};

export const ABSOLUTE_ZERO: Record<TemperatureUnit, number> = {
  C: -273.15, // -273.15°C
  F: -459.67, // -459.67°F
  K: 0, // 0K
};
