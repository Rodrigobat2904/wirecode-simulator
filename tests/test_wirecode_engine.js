const assert = require('assert');
const { ARDUINO_UNO_R3 } = require('../js/hardware/boards');
const { COMPONENT_DEFINITIONS } = require('../js/hardware/components');
const { Circuit, Connection } = require('../js/engine/circuit');
const { FirmwareParser, CircuitValidator } = require('../js/engine/validator');
const { MISSIONS } = require('../js/missions/missions');

console.log('--- RUNNING WIRECODE ENGINE TESTS ---');

// Test 1: Hardware Profile Pin Integrity
console.log('1. Testing Arduino Uno R3 Pin Integrity...');
assert.strictEqual(ARDUINO_UNO_R3.pins['D13'].hasBuiltinLed, true);
assert.strictEqual(ARDUINO_UNO_R3.pins['D9'].pwm, true);
assert.strictEqual(ARDUINO_UNO_R3.pins['D8'].pwm, false);
assert.strictEqual(ARDUINO_UNO_R3.hasPin('D14'), false, 'D14 must not exist on Uno R3');
assert.strictEqual(ARDUINO_UNO_R3.hasPin('A6'), false, 'A6 must not exist on Uno R3');
assert.strictEqual(ARDUINO_UNO_R3.normalizePin('9'), 'D9');
assert.strictEqual(ARDUINO_UNO_R3.normalizePin('A0'), 'A0');
console.log('   ✓ Hardware profile accurate to official Uno R3 specifications.');

// Test 2: Dynamic Firmware Parser
console.log('2. Testing Dynamic Firmware Parser...');
const parser = new FirmwareParser(ARDUINO_UNO_R3);
const sampleCode = `
#define TRIG_PIN 7
#define ECHO_PIN 8
#define BUZZER_PIN 6
void setup() {
  pinMode(TRIG_PIN, OUTPUT);
}
`;
const parsed = parser.parse(sampleCode);
assert.strictEqual(parsed.declarations['TRIG_PIN'], 'D7');
assert.strictEqual(parsed.declarations['ECHO_PIN'], 'D8');
assert.strictEqual(parsed.declarations['BUZZER_PIN'], 'D6');
assert.strictEqual(parsed.pinModes['D7'], 'OUTPUT');
console.log('   ✓ Parser dynamically resolves #define and pinMode.');

// Test 3: Circuit Topology and Short-Circuit Detection
console.log('3. Testing Short-Circuit & Continuity...');
const circuit = new Circuit(ARDUINO_UNO_R3);
circuit.addComponent('led1', 'led_red', COMPONENT_DEFINITIONS.led_red);
circuit.addComponent('res1', 'resistor_220', COMPONENT_DEFINITIONS.resistor_220);

// Connect 5V directly to GND
circuit.addConnection('arduino', '5V', 'arduino', 'GND_1');
const validator = new CircuitValidator(ARDUINO_UNO_R3);
const shortResult = validator.validate(circuit, sampleCode, MISSIONS[0]);
assert.strictEqual(shortResult.hasShortCircuit, true);
assert.strictEqual(shortResult.passed, false);
console.log('   ✓ Direct 5V-GND short circuit correctly detected and halted.');

// Test 4: Series Resistor Continuity Tracing (D5 -> Resistor -> LED Anode)
console.log('4. Testing Netlist Continuity Tracing (LED with Resistor)...');
const m1Circuit = new Circuit(ARDUINO_UNO_R3);
m1Circuit.addComponent('led1', 'led_red', COMPONENT_DEFINITIONS.led_red);
m1Circuit.addComponent('res1', 'resistor_220', COMPONENT_DEFINITIONS.resistor_220);
m1Circuit.addComponent('btn1', 'pushbutton', COMPONENT_DEFINITIONS.pushbutton);

// Wire D5 -> Resistor T1
m1Circuit.addConnection('arduino', 'D5', 'res1', 'T1');
// Resistor T2 -> LED Anode
m1Circuit.addConnection('res1', 'T2', 'led1', 'anode');
// LED Cathode -> GND
m1Circuit.addConnection('led1', 'cathode', 'arduino', 'GND_1');
// Button T1 -> D2, Button T2 -> GND
m1Circuit.addConnection('btn1', 'T1', 'arduino', 'D2');
m1Circuit.addConnection('btn1', 'T2', 'arduino', 'GND_2');

const m1Code = MISSIONS[0].defaultFirmware;
const m1Result = validator.validate(m1Circuit, m1Code, MISSIONS[0]);
assert.strictEqual(m1Result.passed, true, 'Mission 1 valid circuit should pass all rules');
assert.strictEqual(m1Result.items.every(i => i.pass), true);
console.log('   ✓ Mission 01 verified successfully with series resistor tracing.');

// Test 5: Dynamic Pin Change Test
console.log('5. Testing Dynamic Pin Modification Response...');
// User changes code to #define LED_PIN 9 while wire is on D5
const modifiedCode = m1Code.replace('#define LED_PIN 5', '#define LED_PIN 9');
const modifiedResult = validator.validate(m1Circuit, modifiedCode, MISSIONS[0]);
assert.strictEqual(modifiedResult.passed, false, 'Should fail because LED is wired to D5, but code expects D9');
const failItem = modifiedResult.items.find(i => i.label.includes('LED Firmware Mapping'));
assert.strictEqual(failItem.pass, false);
console.log('   ✓ Dynamic mismatch detected when firmware changes #define.');

console.log('\n--- ALL ENGINE TESTS PASSED! ---');
