import {
    TemperatureUnit,
    ValidationResult,
    Temperature,
    UNIT_NAMES,
    UNIT_SYMBOLS
} from './types'

export function isValidUnit(value: string): value is TemperatureUnit {
    return value === 'C' || value === 'F' || value === 'K'
}

export function parseArgs(args: string[]): ValidationResult {
    if (args.length < 3) {
        return {
            valid: false,
            error: 'Missing arguments. Usage: converter <value> <from> <to>'
        }
    }

    const valueStr = args[0]
    const fromStr = args[1]
    const toStr = args[2]

    if (!valueStr || !fromStr || !toStr) {
        return {
            valid: false,
            error: 'Missing arguments. Usage: converter <value> <from> <to>'
        }
    }

    const value = parseFloat(valueStr)

    if (isNaN(value)) {
        return {
            valid: false,
            error: `Invalid temperature value: "${valueStr}"`
        }
    }

    const fromUnit = fromStr.toUpperCase()

    if (!isValidUnit(fromUnit)) {
        return {
            valid: false,
            error: `Invalid source unit: "${fromStr}". Use C, F, or K`
        }
    }

    const toUnit = toStr.toUpperCase()

    if (!isValidUnit(toUnit)) {
        return {
            valid: false,
            error: `Invalid target unit: "${toStr}". Use C, F, or K`
        }
    }

    return {
        valid: true,
        data: {
            value,
            fromUnit,
            toUnit
        }
    }
}

export function formatTemperature(temperature: Temperature): string {
    return `${temperature.value}${UNIT_SYMBOLS[temperature.unit]}`
}

export function formatConversion(
    inputValue: number,
    fromUnit: TemperatureUnit,
    toValue: number,
    toUnit: TemperatureUnit
): string {
    const from = `${inputValue}${UNIT_SYMBOLS[fromUnit]}`
    const to = `${toValue}${UNIT_SYMBOLS[toUnit]}`

    return `${from} = ${to}`
}

export function formatAllConversions(
    originalValue: number,
    originalUnit: TemperatureUnit,
    temperatures: Temperature[]
): string {
    const lines: string[] = []

    lines.push(
        `\n ${originalValue}${UNIT_SYMBOLS[originalUnit]} converted to all units:`
    )

    lines.push('─'.repeat(40))

    for (const temp of temperatures) {
        const symbol = UNIT_SYMBOLS[temp.unit]
        const name = UNIT_NAMES[temp.unit]
        const marker = temp.unit === originalUnit ? ' (original)' : ''

        lines.push(
            `  ${name.padEnd(12)} → ${String(temp.value).padStart(8)}${symbol}${marker}`
        )
    }

    lines.push('─'.repeat(40))

    return lines.join('\n')
}

