const { ARDUINO_UNO_R3 } = require('./js/hardware/boards');
const { COMPONENT_DEFINITIONS } = require('./js/hardware/components');
const { Circuit } = require('./js/engine/circuit');
const { CircuitValidator } = require('./js/engine/validator');
const { MISSIONS } = require('./js/missions/missions');

const circuit = new Circuit(ARDUINO_UNO_R3);
circuit.addComponent('led1', 'led_red', COMPONENT_DEFINITIONS.led_red);
circuit.addComponent('res1', 'resistor_220', COMPONENT_DEFINITIONS.resistor_220);
circuit.addComponent('btn1', 'pushbutton', COMPONENT_DEFINITIONS.pushbutton);

// Connect LED directly without resistor
circuit.addConnection('arduino', 'D5', 'led1', 'anode');
circuit.addConnection('led1', 'cathode', 'arduino', 'GND_1');

const validator = new CircuitValidator(ARDUINO_UNO_R3);
const result = validator.validate(circuit, MISSIONS[0].defaultFirmware, MISSIONS[0]);

console.log('Result passed?', result.passed);
console.log('Diagnostics items:');
result.items.forEach(i => console.log(` - [${i.pass ? 'PASS' : 'FAIL'}] ${i.label}: ${i.detail}`));
