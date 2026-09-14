import {
  Temperature,
  TemperatureUnit,
  ConversionResult,
  ABSOLUTE_ZERO,
} from "./types";

function toCelsius(temperature: Temperature): number {
  switch (temperature.unit) {
    case "C":
      return temperature.value;

    case "F":
      return ((temperature.value - 32) * 5) / 9;

    case "K":
      return temperature.value - 273.15;
  }
}

function fromCelsius(celsius: number, targetUnit: TemperatureUnit): number {
  switch (targetUnit) {
    case "C":
      return celsius;
    case "F":
      return (celsius * 9) / 5 + 32;

    case "K":
      return celsius + 273.15;
  }
}

function isValidTemperature(temperature: Temperature): boolean {
  const minValue = ABSOLUTE_ZERO[temperature.unit];
  return temperature.value >= minValue;
}

export function convert(
  value: number,
  fromUnit: TemperatureUnit,
  toUnit: TemperatureUnit,
): ConversionResult {
  const input: Temperature = { value, unit: fromUnit };

  if (!isValidTemperature(input)) {
    return {
      success: false,
      error:
        `Temperature ${value}${fromUnit} is below absolute zero ` +
        `(minimum: ${ABSOLUTE_ZERO[fromUnit]}${fromUnit})`,
    };
  }

  const celsius = toCelsius(input);
  const resultValue = fromCelsius(celsius, toUnit);
  const rounded = Math.round(resultValue * 100) / 100;

  const output: Temperature = { value: rounded, unit: toUnit };

  if (!isValidTemperature(output)) {
    return {
      success: false,
      error:
        `Conversion resulted in invalid temperature: ` + `${rounded}${toUnit}`,
    };
  }
  return {
    success: true,
    temperature: output,
  };
}

export function convertToAll(
  value: number,
  fromUnit: TemperatureUnit,
): Temperature[] {
  const units: TemperatureUnit[] = ["C", "F", "K"];

  return units.map((unit) => {
    const result = convert(value, fromUnit, unit);

    if (result.success) {
      return result.temperature;
    }

    return { value: 0, unit };
  });
}
