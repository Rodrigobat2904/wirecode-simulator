/**
 * WireCode Component Library
 * Strict physical terminal definitions and electrical characteristics.
 */

const COMPONENT_DEFINITIONS = {
  led_red: {
    typeId: 'led_red',
    name: '5mm Red Diffused LED',
    category: 'optocoupler',
    forwardVoltageV: 2.0,
    maxCurrentMA: 20,
    requiresCurrentLimiter: true,
    terminals: {
      'anode':   { id: 'anode',   label: 'Anode (+)',   polarity: 'positive', description: 'Long lead. Connects to positive voltage via current-limiting resistor.' },
      'cathode': { id: 'cathode', label: 'Cathode (-)', polarity: 'negative', description: 'Short lead / flat edge. Connects to circuit Ground (GND).' }
    }
  },

  resistor_220: {
    typeId: 'resistor_220',
    name: '220Ω 1/4W Resistor',
    category: 'passive',
    resistanceOhms: 220,
    tolerancePercent: 5,
    bands: ['red', 'red', 'brown', 'gold'],
    terminals: {
      'T1': { id: 'T1', label: '1', polarity: 'neutral', description: 'Bilateral terminal 1.' },
      'T2': { id: 'T2', label: '2', polarity: 'neutral', description: 'Bilateral terminal 2.' }
    }
  },

  pushbutton: {
    typeId: 'pushbutton',
    name: 'Tactile Momentary Pushbutton',
    category: 'switch',
    normallyOpen: true,
    terminals: {
      'T1': { id: 'T1', label: 'A', polarity: 'neutral', description: 'Switch Contact A.' },
      'T2': { id: 'T2', label: 'B', polarity: 'neutral', description: 'Switch Contact B.' }
    }
  },

  hc_sr04: {
    typeId: 'hc_sr04',
    name: 'HC-SR04 Ultrasonic Distance Sensor',
    category: 'sensor',
    operatingVoltageV: 5.0,
    workingCurrentMA: 15,
    minDistanceCM: 2,
    maxDistanceCM: 400,
    terminals: {
      'VCC':  { id: 'VCC',  label: 'VCC',  polarity: 'positive', requiredVoltage: 5.0, description: 'Power supply (+5V DC).' },
      'TRIG': { id: 'TRIG', label: 'TRIG', polarity: 'input',    description: 'Trigger pulse input (10us TTL pulse from MCU).' },
      'ECHO': { id: 'ECHO', label: 'ECHO', polarity: 'output',   description: 'Echo pulse output (duration proportional to distance).' },
      'GND':  { id: 'GND',  label: 'GND',  polarity: 'negative', description: 'Circuit Ground (0V).' }
    }
  },

  buzzer_piezo: {
    typeId: 'buzzer_piezo',
    name: 'Piezo Buzzer (Passive)',
    category: 'audio',
    operatingVoltageV: [3.0, 12.0],
    terminals: {
      'positive': { id: 'positive', label: '(+)', polarity: 'positive', description: 'Positive signal lead (PWM or digital out).' },
      'negative': { id: 'negative', label: '(-)', polarity: 'negative', description: 'Negative ground lead (GND).' }
    }
  },

  servo_sg90: {
    typeId: 'servo_sg90',
    name: 'TowerPro SG90 9g Micro Servo',
    category: 'actuator',
    operatingVoltageV: 5.0,
    minAngleDeg: 0,
    maxAngleDeg: 180,
    terminals: {
      'ground': { id: 'ground', label: 'GND',    color: 'brown',  polarity: 'negative', description: 'Ground (Brown wire).' },
      'power':  { id: 'power',  label: '5V',     color: 'red',    polarity: 'positive', description: 'Power supply +5V (Red wire).' },
      'signal': { id: 'signal', label: 'SIGNAL', color: 'orange', polarity: 'input',    description: 'PWM position pulse control (Orange wire).' }
    }
  },

  pir_sensor: {
    typeId: 'pir_sensor',
    name: 'HC-SR501 PIR Motion Sensor',
    category: 'sensor',
    operatingVoltageV: 5.0,
    terminals: {
      'VCC': { id: 'VCC', label: 'VCC', polarity: 'positive', description: 'Power input +5V.' },
      'OUT': { id: 'OUT', label: 'OUT', polarity: 'output',   description: 'Digital output (HIGH on motion, LOW idle).' },
      'GND': { id: 'GND', label: 'GND', polarity: 'negative', description: 'Ground.' }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COMPONENT_DEFINITIONS };
}
