declare const process: {
  argv: string[];
  exit(code?: number): never;
};

declare const console: {
  log(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
};

import { convert, convertToAll } from "./converter";
import { parseArgs, formatConversion, formatAllConversions } from "./utils";
import { runInteractive } from "./interactive";

function main(): void {
  const args = process.argv.slice(2);

  if (args[0] === "-i" || args[0] === "--interactive") {
    runInteractive();
    process.exit(0);
  }

  const parseResult = parseArgs(args);

  if (!parseResult.valid) {
    console.error(`Error: ${parseResult.error}`);
    console.error(`Use --help for usage information`);
    process.exit(1);
  }

  const { value, fromUnit, toUnit } = parseResult.data;

  const thirdArg = args[2]?.toLowerCase();

  if (thirdArg === "all") {
    const allTemps = convertToAll(value, fromUnit);
    console.log(formatAllConversions(value, fromUnit, allTemps));
    process.exit(0);
  }

  const result = convert(value, fromUnit, toUnit);

  if (result.success) {
    console.log(
      `${formatConversion(value, fromUnit, result.temperature.value, toUnit)}`,
    );
  } else {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
}

main();
