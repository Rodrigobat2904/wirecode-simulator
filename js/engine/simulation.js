/**
 * WireCode Interactive Simulation Engine
 * Drives component behavior, user interactions, and visual actuator updates.
 */

class SimulationEngine {
  constructor() {
    this.isRunning = false;
    this.currentMission = null;
    this.circuit = null;
    this.validationResult = null;

    // Simulation state registers
    this.state = {
      // Mission 1: Beacon Alarm
      buttonPressed: false,
      ledOn: false,

      // Mission 2: Parking Radar
      obstacleDistanceCM: 80,
      buzzerBeeping: false,
      pingWaveActive: false,

      // Mission 3: Automatic Gate
      motionDetected: false,
      servoAngleDeg: 0
    };

    this.timerId = null;
    this.onStateChange = null; // callback to trigger UI updates
  }

  start(mission, circuit, validationResult) {
    if (!validationResult || !validationResult.passed) {
      this.isRunning = false;
      return false;
    }

    this.currentMission = mission;
    this.circuit = circuit;
    this.validationResult = validationResult;
    this.isRunning = true;

    if (this.currentMission.id === 'mission_02') {
      this.startRadarLoop();
    }

    this.notify();
    return true;
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.state.ledOn = false;
    this.state.buzzerBeeping = false;
    this.state.pingWaveActive = false;
    this.state.servoAngleDeg = 0;
    this.notify();
  }

  // --- Mission 1 Actions ---
  setButtonState(isPressed) {
    this.state.buttonPressed = isPressed;
    if (!this.isRunning || this.currentMission.id !== 'mission_01') return;

    // In Mission 1 with INPUT_PULLUP, pressed button pulls pin to LOW -> LED ON
    this.state.ledOn = isPressed;
    this.notify();
  }

  // --- Mission 2 Actions ---
  setObstacleDistance(distCM) {
    this.state.obstacleDistanceCM = Math.max(5, Math.min(200, distCM));
    this.notify();
  }

  startRadarLoop() {
    if (this.timerId) clearInterval(this.timerId);
    let tick = 0;

    this.timerId = setInterval(() => {
      if (!this.isRunning) return;
      tick++;

      // Trigger ultrasonic sound wave pulse every 10 ticks
      this.state.pingWaveActive = (tick % 6 < 3);

      // Radar threshold: If distance < 30 cm, beep buzzer with frequency based on distance
      const dist = this.state.obstacleDistanceCM;
      if (dist < 30) {
        // Closer distance -> faster beep rate
        const beepInterval = Math.max(1, Math.floor(dist / 8));
        this.state.buzzerBeeping = (tick % (beepInterval + 1) === 0);
      } else {
        this.state.buzzerBeeping = false;
      }

      this.notify();
    }, 100);
  }

  // --- Mission 3 Actions ---
  triggerMotion() {
    if (!this.isRunning || this.currentMission.id !== 'mission_03') return;

    this.state.motionDetected = true;
    this.state.servoAngleDeg = 90; // Open gate
    this.notify();

    // Auto-close gate after 2.5 seconds
    setTimeout(() => {
      if (this.isRunning && this.currentMission.id === 'mission_03') {
        this.state.motionDetected = false;
        this.state.servoAngleDeg = 0; // Close gate
        this.notify();
      }
    }, 2500);
  }

  notify() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.state);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimulationEngine };
}
