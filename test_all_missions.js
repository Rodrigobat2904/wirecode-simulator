const { ARDUINO_UNO_R3 } = require('./js/hardware/boards');
const { COMPONENT_DEFINITIONS } = require('./js/hardware/components');
const { Circuit } = require('./js/engine/circuit');
const { CircuitValidator } = require('./js/engine/validator');
const { MISSIONS } = require('./js/missions/missions');

const validator = new CircuitValidator(ARDUINO_UNO_R3);

// Mission 1
const c1 = new Circuit(ARDUINO_UNO_R3);
c1.addComponent('led1', 'led_red', COMPONENT_DEFINITIONS.led_red);
c1.addComponent('res1', 'resistor_220', COMPONENT_DEFINITIONS.resistor_220);
c1.addComponent('btn1', 'pushbutton', COMPONENT_DEFINITIONS.pushbutton);
c1.addConnection('arduino', 'D5', 'res1', 'T1');
c1.addConnection('res1', 'T2', 'led1', 'anode');
c1.addConnection('led1', 'cathode', 'arduino', 'GND_1');
c1.addConnection('btn1', 'T1', 'arduino', 'D2');
c1.addConnection('btn1', 'T2', 'arduino', 'GND_2');
const r1 = validator.validate(c1, MISSIONS[0].defaultFirmware, MISSIONS[0]);
console.log('M1 Passed:', r1.passed);

// Mission 2
const c2 = new Circuit(ARDUINO_UNO_R3);
c2.addComponent('sonar1', 'hc_sr04', COMPONENT_DEFINITIONS.hc_sr04);
c2.addComponent('buzzer1', 'buzzer_piezo', COMPONENT_DEFINITIONS.buzzer_piezo);
c2.addConnection('sonar1', 'VCC', 'arduino', '5V');
c2.addConnection('sonar1', 'GND', 'arduino', 'GND_1');
c2.addConnection('sonar1', 'TRIG', 'arduino', 'D9');
c2.addConnection('sonar1', 'ECHO', 'arduino', 'D8');
c2.addConnection('buzzer1', 'positive', 'arduino', 'D6');
c2.addConnection('buzzer1', 'negative', 'arduino', 'GND_2');
const r2 = validator.validate(c2, MISSIONS[1].defaultFirmware, MISSIONS[1]);
console.log('M2 Passed:', r2.passed);

// Mission 3
const c3 = new Circuit(ARDUINO_UNO_R3);
c3.addComponent('pir1', 'pir_sensor', COMPONENT_DEFINITIONS.pir_sensor);
c3.addComponent('servo1', 'servo_sg90', COMPONENT_DEFINITIONS.servo_sg90);
c3.addConnection('pir1', 'VCC', 'arduino', '5V');
c3.addConnection('pir1', 'GND', 'arduino', 'GND_1');
c3.addConnection('pir1', 'OUT', 'arduino', 'D3');
c3.addConnection('servo1', 'power', 'arduino', '5V');
c3.addConnection('servo1', 'ground', 'arduino', 'GND_2');
c3.addConnection('servo1', 'signal', 'arduino', 'D10');
const r3 = validator.validate(c3, MISSIONS[2].defaultFirmware, MISSIONS[2]);
console.log('M3 Passed:', r3.passed);
