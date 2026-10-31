/**
 * WireCode Mission Library
 * Defines educational challenges, default firmware, required components,
 * and deterministic circuit graph validation rules.
 */

const MISSIONS = [
  {
    id: 'mission_01',
    number: '01',
    title: 'Beacon Alarm (LED & Button)',
    difficulty: 'Beginner',
    summary: 'Rangkai LED dengan resistor pembatas arus dan sebuah pushbutton dengan mode INPUT_PULLUP.',
    learningObjectives: [
      'Digital I/O & GPIO configuration',
      'Polaritas LED (Anoda vs Katoda)',
      'Fungsi Resistor Pembatas Arus (Current Limiting)',
      'Konsep tombol active-LOW dengan internal INPUT_PULLUP'
    ],
    hint: 'Hubungkan Pin D5 ke Resistor, seberang resistor ke Anoda LED, dan Katoda ke GND. Hubungkan tombol antara Pin D2 dan GND.',
    
    components: [
      { instanceId: 'led1', typeId: 'led_red', x: 500, y: 120 },
      { instanceId: 'res1', typeId: 'resistor_220', x: 620, y: 130 },
      { instanceId: 'btn1', typeId: 'pushbutton', x: 540, y: 310 }
    ],

    defaultFirmware: `// WireCode Mission 01: Beacon Alarm
#define LED_PIN 5
#define BUTTON_PIN 2

void setup() {
  // Input pull-up: Pin terbaca HIGH saat tombol terbuka,
  // dan menjadi LOW saat tombol ditekan ke GND
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW) {
    digitalWrite(LED_PIN, HIGH); // Nyalakan LED
  } else {
    digitalWrite(LED_PIN, LOW);  // Matikan LED
  }
}`,

    verifyRules(circuit, parsedFirmware, board) {
      const results = [];
      const isGround = (p) => p.componentId === 'arduino' && (p.terminalId === 'GND_1' || p.terminalId === 'GND_2' || p.terminalId === 'GND_DIG');

      // 1. Resolve declared pins
      const expectedLedPin = parsedFirmware.declarations['LED_PIN'] || 'D5';
      const expectedBtnPin = parsedFirmware.declarations['BUTTON_PIN'] || 'D2';

      // 2. Check LED Cathode connected to Ground
      const cathodePartners = circuit.getDirectPartners('led1', 'cathode');
      const cathodeGnd = cathodePartners.some(isGround);
      results.push({
        pass: cathodeGnd,
        label: 'LED Cathode Ground Path',
        detail: cathodeGnd ? 'LED Katoda terhubung ke Ground (GND).' : 'Katoda (-) LED belum terhubung ke pin GND Arduino.'
      });

      // 3. Check Current Limiting Resistor in LED circuit
      const traceAnode = circuit.traceContinuity('led1', 'anode');
      const hasResistorInPath = traceAnode.some(p => p.componentId === 'res1');
      results.push({
        pass: hasResistorInPath,
        label: 'Current-Limiting Resistor Protection',
        detail: hasResistorInPath 
          ? 'Resistor 220Ω terpasang seri pada jalur LED.' 
          : 'Peringatan: LED harus dilindungi resistor 220Ω agar tidak terbakar!'
      });

      // 4. Check LED connection to declared LED_PIN
      const touchesExpectedLedPin = traceAnode.some(p => p.componentId === 'arduino' && p.terminalId === expectedLedPin);
      results.push({
        pass: touchesExpectedLedPin,
        label: `LED Firmware Mapping (${expectedLedPin})`,
        detail: touchesExpectedLedPin 
          ? `LED Anoda terhubung ke pin ${expectedLedPin} sesuai deklarasi firmware.` 
          : `LED belum terhubung ke pin ${expectedLedPin}. Periksa wiring atau nilai #define LED_PIN!`
      });

      // 5. Check Pushbutton (INPUT_PULLUP mode: One terminal to BUTTON_PIN, one to GND)
      const btnT1Partners = circuit.getDirectPartners('btn1', 'T1');
      const btnT2Partners = circuit.getDirectPartners('btn1', 'T2');

      const t1ToPin = btnT1Partners.some(p => p.componentId === 'arduino' && p.terminalId === expectedBtnPin);
      const t2ToPin = btnT2Partners.some(p => p.componentId === 'arduino' && p.terminalId === expectedBtnPin);
      const t1ToGnd = btnT1Partners.some(isGround);
      const t2ToGnd = btnT2Partners.some(isGround);

      const buttonWiredCorrectly = (t1ToPin && t2ToGnd) || (t2ToPin && t1ToGnd);
      results.push({
        pass: buttonWiredCorrectly,
        label: `Pushbutton Wiring (${expectedBtnPin} to GND)`,
        detail: buttonWiredCorrectly
          ? `Tombol terhubung antara pin ${expectedBtnPin} dan GND (Active-LOW).`
          : `Tombol belum terhubung dengan benar antara pin ${expectedBtnPin} dan GND.`
      });

      return results;
    }
  },

  {
    id: 'mission_02',
    number: '02',
    title: 'Parking Radar (HC-SR04 Ultrasonic)',
    difficulty: 'Intermediate',
    summary: 'Rangkai sensor ultrasonik HC-SR04 untuk mendeteksi rintangan dan buzzer sebagai alarm audio.',
    learningObjectives: [
      'Protokol pulsa sensor ultrasonik (Trigger 10µs & Echo duration)',
      'Pemetaan pin input/output terpisah untuk sensor',
      'Pengendalian Piezo Buzzer secara kondisional'
    ],
    hint: 'HC-SR04 VCC -> 5V, GND -> GND, TRIG -> D9, ECHO -> D8. Buzzer (+) -> D6, Buzzer (-) -> GND.',

    components: [
      { instanceId: 'sonar1', typeId: 'hc_sr04', x: 500, y: 70 },
      { instanceId: 'buzzer1', typeId: 'buzzer_piezo', x: 540, y: 320 }
    ],

    defaultFirmware: `// WireCode Mission 02: Parking Radar
#define TRIG_PIN 9
#define ECHO_PIN 8
#define BUZZER_PIN 6

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  // Simulator menghitung durasi pantulan pulsa suara
  // Jika jarak < 30 cm, buzzer berbunyi semakin cepat
}`,

    verifyRules(circuit, parsedFirmware, board) {
      const results = [];
      const isGround = (p) => p.componentId === 'arduino' && (p.terminalId === 'GND_1' || p.terminalId === 'GND_2' || p.terminalId === 'GND_DIG');
      const is5V = (p) => p.componentId === 'arduino' && p.terminalId === '5V';

      const expTrig = parsedFirmware.declarations['TRIG_PIN'] || 'D9';
      const expEcho = parsedFirmware.declarations['ECHO_PIN'] || 'D8';
      const expBuzzer = parsedFirmware.declarations['BUZZER_PIN'] || 'D6';

      // 1. HC-SR04 Power & GND
      const vccOk = circuit.getDirectPartners('sonar1', 'VCC').some(is5V);
      results.push({
        pass: vccOk,
        label: 'Sensor Power (VCC -> 5V)',
        detail: vccOk ? 'HC-SR04 VCC terhubung ke supply 5V.' : 'VCC sensor belum terhubung ke pin 5V Arduino.'
      });

      const gndOk = circuit.getDirectPartners('sonar1', 'GND').some(isGround);
      results.push({
        pass: gndOk,
        label: 'Sensor Ground (GND)',
        detail: gndOk ? 'HC-SR04 GND terhubung ke Ground.' : 'GND sensor belum terhubung ke pin GND Arduino.'
      });

      // 2. TRIG Pin Mapping
      const trigOk = circuit.getDirectPartners('sonar1', 'TRIG').some(p => p.componentId === 'arduino' && p.terminalId === expTrig);
      results.push({
        pass: trigOk,
        label: `Trigger Pin Mapping (${expTrig})`,
        detail: trigOk ? `Pin TRIG terhubung ke ${expTrig}.` : `Pin TRIG belum terhubung ke ${expTrig} sesuai deklarasi firmware.`
      });

      // 3. ECHO Pin Mapping
      const echoOk = circuit.getDirectPartners('sonar1', 'ECHO').some(p => p.componentId === 'arduino' && p.terminalId === expEcho);
      results.push({
        pass: echoOk,
        label: `Echo Pin Mapping (${expEcho})`,
        detail: echoOk ? `Pin ECHO terhubung ke ${expEcho}.` : `Pin ECHO belum terhubung ke ${expEcho} sesuai deklarasi firmware.`
      });

      // 4. Buzzer Wiring
      const buzzPosOk = circuit.getDirectPartners('buzzer1', 'positive').some(p => p.componentId === 'arduino' && p.terminalId === expBuzzer);
      const buzzNegOk = circuit.getDirectPartners('buzzer1', 'negative').some(isGround);
      const buzzerOk = buzzPosOk && buzzNegOk;
      results.push({
        pass: buzzerOk,
        label: `Piezo Buzzer Wiring (${expBuzzer} & GND)`,
        detail: buzzerOk ? `Buzzer terhubung ke pin ${expBuzzer} dan GND.` : `Buzzer belum terhubung benar ke pin ${expBuzzer} dan GND.`
      });

      return results;
    }
  },

  {
    id: 'mission_03',
    number: '03',
    title: 'Automatic Gate (SG90 Servo & PIR)',
    difficulty: 'Intermediate to Advanced',
    summary: 'Buat palang pintu otomatis: saat sensor gerak mendeteksi orang, servo membuka 90 derajat.',
    learningObjectives: [
      'Pemisahan daya (VCC/GND) dan sinyal kendali PWM pada motor servo',
      'Pemrosesan sinyal digital sensor gerak PIR',
      'Kontrol sudut aktuator mekanik'
    ],
    hint: 'PIR VCC -> 5V, GND -> GND, OUT -> D3. Servo Power (Merah) -> 5V, Ground (Cokelat) -> GND, Sinyal (Oranye) -> D10.',

    components: [
      { instanceId: 'pir1', typeId: 'pir_sensor', x: 500, y: 90 },
      { instanceId: 'servo1', typeId: 'servo_sg90', x: 500, y: 310 }
    ],

    defaultFirmware: `// WireCode Mission 03: Automatic Gate
#define PIR_PIN 3
#define SERVO_PIN 10

void setup() {
  pinMode(PIR_PIN, INPUT);
  pinMode(SERVO_PIN, OUTPUT);
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  if (motion == HIGH) {
    // Sinyal PWM membuka pintu 90 derajat
  } else {
    // Sinyal PWM menutup pintu 0 derajat
  }
}`,

    verifyRules(circuit, parsedFirmware, board) {
      const results = [];
      const isGround = (p) => p.componentId === 'arduino' && (p.terminalId === 'GND_1' || p.terminalId === 'GND_2' || p.terminalId === 'GND_DIG');
      const is5V = (p) => p.componentId === 'arduino' && p.terminalId === '5V';

      const expPir = parsedFirmware.declarations['PIR_PIN'] || 'D3';
      const expServo = parsedFirmware.declarations['SERVO_PIN'] || 'D10';

      // 1. PIR Sensor Power & Signal
      const pirVcc = circuit.getDirectPartners('pir1', 'VCC').some(is5V);
      const pirGnd = circuit.getDirectPartners('pir1', 'GND').some(isGround);
      const pirOut = circuit.getDirectPartners('pir1', 'OUT').some(p => p.componentId === 'arduino' && p.terminalId === expPir);

      results.push({
        pass: pirVcc && pirGnd,
        label: 'PIR Power (5V & GND)',
        detail: (pirVcc && pirGnd) ? 'Sensor PIR terhubung ke daya 5V dan GND.' : 'Sensor PIR kekurangan supply 5V atau GND.'
      });
      results.push({
        pass: pirOut,
        label: `PIR Output Pin (${expPir})`,
        detail: pirOut ? `Pin OUT sensor PIR terhubung ke ${expPir}.` : `Pin OUT PIR belum terhubung ke ${expPir}.`
      });

      // 2. Servo SG90 Power & PWM
      const servoPwr = circuit.getDirectPartners('servo1', 'power').some(is5V);
      const servoGnd = circuit.getDirectPartners('servo1', 'ground').some(isGround);
      const servoSig = circuit.getDirectPartners('servo1', 'signal').some(p => p.componentId === 'arduino' && p.terminalId === expServo);

      results.push({
        pass: servoPwr && servoGnd,
        label: 'Servo Motor Power (5V & GND)',
        detail: (servoPwr && servoGnd) ? 'Daya motor servo SG90 terhubung ke 5V dan GND.' : 'Motor servo belum terhubung ke 5V dan GND.'
      });
      results.push({
        pass: servoSig,
        label: `Servo PWM Signal Pin (${expServo})`,
        detail: servoSig ? `Sinyal kendali servo terhubung ke ${expServo}.` : `Kabel sinyal (oranye) servo belum terhubung ke ${expServo}.`
      });

      return results;
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MISSIONS };
}
