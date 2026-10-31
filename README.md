# WireCode: Arduino Firmware-to-Wiring Puzzle Simulator

> An interactive educational electronics platform & serious game connecting Arduino C++ firmware declarations, accurate physical microcontroller pinouts, netlist circuit graph validation, and real-time component simulation.

[![Tests](https://img.shields.io/badge/tests-5%20passed-brightgreen.svg)]()
[![Hardware Reference](https://img.shields.io/badge/hardware-Arduino%20Uno%20R3-008184.svg)]()
[![Deployment](https://img.shields.io/badge/deployed-GitHub%20Pages-blue.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/dependencies-vanilla%20JS%2FSVG-success.svg)]()

---

## ⚡ Overview & Core Philosophy

In embedded systems education, students frequently encounter a frustrating barrier: they can find Arduino code online, but struggle to translate firmware declarations into physical breadboard connections.

**WireCode** bridges this gap through three principles:
1. **Understand the Code:** Firmware configures pins (`#define`, `pinMode`, `digitalWrite`).
2. **Build the Circuit:** Connect physical components using virtual flexible Bézier jumper wires.
3. **Make It Work:** Verify continuity, detect polarity & short-circuit faults, and operate the live interactive simulation.

---

## 🔬 Hardware Accuracy & Pin Integrity

Per Section 2 of the technical specification: **No fictional pins are ever invented.**

- **Official Board:** Arduino Uno R3 ([Official Reference](https://docs.arduino.cc/hardware/uno-rev3/)).
- **Digital I/O:** Exactly D0–D13. PWM is strictly modeled only on hardware-capable pins: `D3, D5, D6, D9, D10, D11`.
- **Analog Inputs:** Exactly A0–A5 (10-bit ADC).
- **Power & Reference:** 5V, 3.3V, 3x Physical GND (2 on power header, 1 on digital header), VIN, RESET, IOREF, AREF.
- **Components:** Physical terminals only (e.g. LED Anode/Cathode, HC-SR04 VCC/TRIG/ECHO/GND, SG90 Servo Power/Ground/Signal).

---

## 🚀 Dynamic Firmware Parser & Netlist Graph

Unlike static quiz apps, WireCode dynamically resolves user code:

```cpp
#define TRIG_PIN 9
#define ECHO_PIN 8
```

If the user changes `#define TRIG_PIN 7`, the simulator **dynamically updates the validation target to Pin D7**. If an impossible pin is entered (`#define TRIG_PIN 44`), the diagnostics console flags that the pin does not exist on the Uno R3 profile.

Connections are stored as a **Logical Netlist Graph** rather than pixel coordinates, enabling series component continuity tracing (e.g., `D5 -> [Resistor 220Ω] -> [LED Anode] -> [LED Cathode] -> GND`).

---

## 🎮 Included Missions

| Mission | Title | Components | Educational Focus |
|---|---|---|---|
| **01** | **Beacon Alarm** | Arduino Uno R3, 5mm Red LED, 220Ω Resistor, Pushbutton | LED polarity, series current-limiting protection, `INPUT_PULLUP` active-LOW logic |
| **02** | **Parking Radar** | Arduino Uno R3, HC-SR04 Ultrasonic Sensor, Piezo Buzzer | Ultrasonic 10µs pulse & echo timing, interactive distance obstacle slider, acoustic frequency alarm |
| **03** | **Automatic Gate** | Arduino Uno R3, SG90 Micro Servo, PIR Sensor | Sinyal PWM actuator angle rotation ($0^\circ \leftrightarrow 90^\circ$), power/ground/signal separation |

---

## 🧪 Automated Engine Test Suite

Run the headless verification suite via Node.js:

```bash
node tests/test_wirecode_engine.js
```

Test coverage includes:
- Arduino Uno R3 pinout & PWM capability verification.
- Dynamic `#define` and `pinMode` micro-lexer parser.
- Direct 5V $\leftrightarrow$ GND short-circuit detection & halt.
- Series resistor continuity tracing across bilateral passives.
- Dynamic firmware modification mismatch response.

---

## 🌐 Live Web Demo

Play the live simulator directly in your browser:  
👉 **[https://rodrigobat2904.github.io/wirecode-simulator/](https://rodrigobat2904.github.io/wirecode-simulator/)**

---

## 📜 License
MIT License. Open source for engineering education and portfolio demonstration.
