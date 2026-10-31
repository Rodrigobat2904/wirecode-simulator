/**
 * WireCode Validation Engine & Firmware Parser
 * Evaluates logical circuit graph against board profiles and dynamic firmware pin declarations.
 */

class FirmwareParser {
  constructor(boardProfile) {
    this.board = boardProfile;
  }

  /**
   * Parse user code to extract pin mappings and pinModes.
   * Supports: #define PIN_NAME value, const int PIN_NAME = value
   */
  parse(sourceCode) {
    const declarations = {};
    const pinModes = {};
    const errors = [];

    const lines = sourceCode.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Ignore single-line comments
      if (line.startsWith('//') || line.startsWith('/*')) continue;

      // 1. Match: #define MACRO_NAME VALUE
      const defineMatch = line.match(/^#define\s+([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)/);
      if (defineMatch) {
        const name = defineMatch[1];
        const rawVal = defineMatch[2];
        const normalized = this.board.normalizePin(rawVal);
        if (!normalized) {
          errors.push({ line: lineNum, message: `Pin '${rawVal}' does not exist on ${this.board.name}.` });
        } else {
          declarations[name] = normalized;
        }
      }

      // 2. Match: const int / int VAR_NAME = VALUE;
      const constMatch = line.match(/(?:const\s+)?int\s+([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)\s*;/);
      if (constMatch) {
        const name = constMatch[1];
        const rawVal = constMatch[2];
        const normalized = this.board.normalizePin(rawVal);
        if (!normalized) {
          errors.push({ line: lineNum, message: `Pin '${rawVal}' does not exist on ${this.board.name}.` });
        } else {
          declarations[name] = normalized;
        }
      }

      // 3. Match: pinMode(PIN_NAME, MODE);
      const pinModeMatch = line.match(/pinMode\s*\(\s*([A-Za-z0-9_]+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/);
      if (pinModeMatch) {
        const pinRef = pinModeMatch[1];
        const mode = pinModeMatch[2];
        const resolvedPin = declarations[pinRef] || this.board.normalizePin(pinRef);
        if (resolvedPin) {
          pinModes[resolvedPin] = mode;
        }
      }
    }

    return { declarations, pinModes, errors };
  }
}

class CircuitValidator {
  constructor(boardProfile) {
    this.board = boardProfile;
    this.parser = new FirmwareParser(boardProfile);
  }

  /**
   * Validate circuit against mission requirements and parsed firmware.
   */
  validate(circuit, firmwareCode, missionRequirements) {
    const results = {
      passed: false,
      hasShortCircuit: false,
      items: [],
      parsedFirmware: null
    };

    // 1. Parse Firmware
    const parsed = this.parser.parse(firmwareCode);
    results.parsedFirmware = parsed;

    if (parsed.errors.length > 0) {
      for (const err of parsed.errors) {
        results.items.push({
          pass: false,
          label: 'Firmware Syntax Error',
          detail: `Line ${err.line}: ${err.message}`
        });
      }
      return results;
    }

    // 2. Check for Direct Short Circuit (5V directly connected to Ground)
    const direct5VPartners = circuit.getDirectPartners('arduino', '5V');
    const isGnd = (p) => p.componentId === 'arduino' && (p.terminalId === 'GND_1' || p.terminalId === 'GND_2' || p.terminalId === 'GND_DIG');
    if (direct5VPartners.some(isGnd)) {
      results.hasShortCircuit = true;
      results.items.push({
        pass: false,
        critical: true,
        label: 'CRITICAL ELECTRICAL FAULT: Short Circuit',
        detail: 'Direct bridge detected between 5V and GND without electrical load! Simulator halted.'
      });
      return results;
    }

    // 3. Run Mission-Specific Connection Rules
    if (missionRequirements && missionRequirements.verifyRules) {
      const ruleOutputs = missionRequirements.verifyRules(circuit, parsed, this.board);
      results.items.push(...ruleOutputs);
    }

    // Pass condition: at least one rule ran and all passed
    results.passed = results.items.length > 0 && results.items.every(item => item.pass);
    return results;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FirmwareParser, CircuitValidator };
}
