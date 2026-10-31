/**
 * WireCode Hardware Profile: Arduino Uno R3
 * Official Reference: https://docs.arduino.cc/hardware/uno-rev3/
 * 
 * Strict Hardware Accuracy Rule:
 * Every physical pin corresponds to the actual physical Uno R3.
 * No fictional pins, no arbitrary expansions.
 */

const ARDUINO_UNO_R3 = {
  id: 'arduino_uno_r3',
  name: 'Arduino Uno R3',
  microcontroller: 'ATmega328P',
  operatingVoltage: 5.0, // Volts
  inputVoltageRecommended: [7.0, 12.0], // Volts
  flashMemoryKB: 32,
  sramKB: 2,
  clockSpeedMHz: 16,

  // Pin groups and functional capabilities
  pins: {
    // Top Digital Header (10-pin + 8-pin physical headers)
    'D0':  { id: 'D0',  label: '0',  category: 'digital', pwm: false, uart: 'RX', interrupt: false, description: 'Digital I/O / Serial Receive (RX)' },
    'D1':  { id: 'D1',  label: '1',  category: 'digital', pwm: false, uart: 'TX', interrupt: false, description: 'Digital I/O / Serial Transmit (TX)' },
    'D2':  { id: 'D2',  label: '2',  category: 'digital', pwm: false, interrupt: 'INT0', description: 'Digital I/O / External Interrupt 0' },
    'D3':  { id: 'D3',  label: '~3', category: 'digital', pwm: true,  interrupt: 'INT1', description: 'Digital I/O / PWM / External Interrupt 1' },
    'D4':  { id: 'D4',  label: '4',  category: 'digital', pwm: false, description: 'Digital I/O' },
    'D5':  { id: 'D5',  label: '~5', category: 'digital', pwm: true,  description: 'Digital I/O / PWM' },
    'D6':  { id: 'D6',  label: '~6', category: 'digital', pwm: true,  description: 'Digital I/O / PWM' },
    'D7':  { id: 'D7',  label: '7',  category: 'digital', pwm: false, description: 'Digital I/O' },
    'D8':  { id: 'D8',  label: '8',  category: 'digital', pwm: false, description: 'Digital I/O' },
    'D9':  { id: 'D9',  label: '~9', category: 'digital', pwm: true,  description: 'Digital I/O / PWM' },
    'D10': { id: 'D10', label: '~10', category: 'digital', pwm: true,  spi: 'SS',   description: 'Digital I/O / PWM / SPI Slave Select' },
    'D11': { id: 'D11', label: '~11', category: 'digital', pwm: true,  spi: 'MOSI', description: 'Digital I/O / PWM / SPI Master Out Slave In' },
    'D12': { id: 'D12', label: '12',  category: 'digital', pwm: false, spi: 'MISO', description: 'Digital I/O / SPI Master In Slave Out' },
    'D13': { id: 'D13', label: '13',  category: 'digital', pwm: false, spi: 'SCK',  hasBuiltinLed: true, description: 'Digital I/O / SPI Clock / Built-in LED' },
    'GND_DIG': { id: 'GND_DIG', label: 'GND', category: 'ground', voltage: 0.0, description: 'Digital Ground' },
    'AREF':    { id: 'AREF',    label: 'AREF', category: 'reference', description: 'Analog Reference Voltage' },

    // Bottom Power Header
    'IOREF': { id: 'IOREF', label: 'IOREF', category: 'power', voltage: 5.0, description: 'I/O Reference Voltage (5V)' },
    'RESET': { id: 'RESET', label: 'RESET', category: 'control', description: 'Active-low Microcontroller Reset' },
    '3V3':   { id: '3V3',   label: '3.3V',  category: 'power', voltage: 3.3, maxCurrentMA: 50, description: '3.3V Regulated Output' },
    '5V':    { id: '5V',    label: '5V',    category: 'power', voltage: 5.0, description: '5V Regulated Power Supply' },
    'GND_1': { id: 'GND_1', label: 'GND',   category: 'ground', voltage: 0.0, description: 'Power Ground 1' },
    'GND_2': { id: 'GND_2', label: 'GND',   category: 'ground', voltage: 0.0, description: 'Power Ground 2' },
    'VIN':   { id: 'VIN',   label: 'VIN',   category: 'power', voltage: '7-12V', description: 'Raw Input Voltage Supply' },

    // Bottom Analog In Header
    'A0': { id: 'A0', label: 'A0', category: 'analog', resolutionBits: 10, description: 'Analog Input 0 (0-5V)' },
    'A1': { id: 'A1', label: 'A1', category: 'analog', resolutionBits: 10, description: 'Analog Input 1 (0-5V)' },
    'A2': { id: 'A2', label: 'A2', category: 'analog', resolutionBits: 10, description: 'Analog Input 2 (0-5V)' },
    'A3': { id: 'A3', label: 'A3', category: 'analog', resolutionBits: 10, description: 'Analog Input 3 (0-5V)' },
    'A4': { id: 'A4', label: 'A4', category: 'analog', resolutionBits: 10, i2c: 'SDA', description: 'Analog Input 4 / I2C Serial Data (SDA)' },
    'A5': { id: 'A5', label: 'A5', category: 'analog', resolutionBits: 10, i2c: 'SCL', description: 'Analog Input 5 / I2C Serial Clock (SCL)' },
  },

  // Helper method: verify if a pin string exists
  hasPin(pinId) {
    return Object.prototype.hasOwnProperty.call(this.pins, pinId);
  },

  // Normalize common user alias (e.g., '9' -> 'D9', 'GND' -> match any ground)
  normalizePin(pinAlias) {
    if (!pinAlias) return null;
    const clean = String(pinAlias).trim().toUpperCase();
    if (this.hasPin(clean)) return clean;
    if (this.hasPin('D' + clean)) return 'D' + clean;
    if (clean === 'GND') return 'GND_1'; // Standard ground reference
    return null;
  }
};

// Export for Node.js test environment if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARDUINO_UNO_R3 };
}
