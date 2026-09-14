declare const console: {
    log: (...args: unknown[]) => void
}

import * as readline from 'readline-sync'
import { convert, convertToAll } from './converter'
import { 
    isValidUnit, 
    formatAllConversions, 
    formatConversion 
} from './utils'
import { TemperatureUnit, UNIT_SYMBOLS } from './types'

function promptTemperature(): number | null {
    const input = readline.question('Enter temperature (or "q" to quit): ')
    
    if (input.toLowerCase() === 'q') {
        return null
    }
    
    const value = parseFloat(input)
    
    if (isNaN(value)) {
        console.log('❌ Invalid number. Please try again.\n')
        return promptTemperature()
    }
    
    return value
}

function promptUnit(prompt: string): TemperatureUnit | null {
    const input = readline.question(`${prompt} (C/F/K, or "q" to quit): `)
    
    if (input.toLowerCase() === 'q') {
        return null
    }
    
    const unit = input.toUpperCase()
    
    if (!isValidUnit(unit)) {
        console.log('❌ Invalid unit. Use C, F, or K.\n')
        return promptUnit(prompt)
    }
    
    return unit
}

export function runInteractive(): void {
    console.log(`
╔════════════════════════════════════════════════════╗
║      TEMPERATURE CONVERTER - INTERACTIVE MODE      ║
║                                                    ║
║      Type "q" at any prompt to quit                ║
╚════════════════════════════════════════════════════╝
    `)
    
    while (true) {
        const value = promptTemperature()
        if (value === null) break
        
        const fromUnit = promptUnit('From unit')
        if (fromUnit === null) break
        
        const toInput = readline.question('To unit (C/F/K/all, or "q" to quit): ')
        if (toInput.toLowerCase() === 'q') break
        
        if (toInput.toLowerCase() === 'all') {
            const allTemps = convertToAll(value, fromUnit)
            console.log(formatAllConversions(value, fromUnit, allTemps))
            console.log()
            continue
        }
        
        const toUnit = toInput.toUpperCase()
        
        if (!isValidUnit(toUnit)) {
            console.log('❌ Invalid unit. Use C, F, K, or all.\n')
            continue
        }
        
        const result = convert(value, fromUnit, toUnit)
        
        if (result.success) {
            console.log(`\n✅ ${formatConversion(
                value, 
                fromUnit, 
                result.temperature.value, 
                toUnit
            )}\n`)
        } else {
            console.log(`\n❌ Error: ${result.error}\n`)
        }
    }
    
    console.log('\n👋 Goodbye!\n')
}