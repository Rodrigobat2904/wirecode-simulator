const { ARDUINO_UNO_R3 } = require('./js/hardware/boards');
const { COMPONENT_DEFINITIONS } = require('./js/hardware/components');
const { Circuit } = require('./js/engine/circuit');
const { CircuitValidator } = require('./js/engine/validator');
const { MISSIONS } = require('./js/missions/missions');

const circuit = new Circuit(ARDUINO_UNO_R3);
circuit.addComponent('pir1', 'pir_sensor', COMPONENT_DEFINITIONS.pir_sensor);
circuit.addComponent('servo1', 'servo_sg90', COMPONENT_DEFINITIONS.servo_sg90);

// Plug both to 5V
circuit.addConnection('arduino', '5V', 'pir1', 'VCC');
circuit.addConnection('arduino', '5V', 'servo1', 'power');

// Plug to grounds
circuit.addConnection('arduino', 'GND_1', 'pir1', 'GND');
circuit.addConnection('arduino', 'GND_2', 'servo1', 'ground');

// Signals
circuit.addConnection('arduino', 'D3', 'pir1', 'OUT');
circuit.addConnection('arduino', 'D10', 'servo1', 'signal');

const validator = new CircuitValidator(ARDUINO_UNO_R3);
const res = validator.validate(circuit, MISSIONS[2].defaultFirmware, MISSIONS[2]);
console.log('Mission 3 Valid?', res.passed);
res.items.forEach(i => console.log(` - [${i.pass ? 'PASS' : 'FAIL'}] ${i.label}: ${i.detail}`));
