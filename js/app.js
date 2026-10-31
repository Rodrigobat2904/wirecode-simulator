/**
 * WireCode Main Application Controller
 */

class WireCodeApp {
  constructor() {
    this.currentMissionIdx = 0;
    this.circuit = new Circuit(ARDUINO_UNO_R3);
    this.validator = new CircuitValidator(ARDUINO_UNO_R3);
    this.simEngine = new SimulationEngine();

    this.initDOMRefs();
    this.initWorkbench();
    this.attachEvents();

    this.loadMission(0);
  }

  initDOMRefs() {
    this.missionSelect = document.getElementById('mission-select');
    this.missionTitle = document.getElementById('mission-title');
    this.missionSummary = document.getElementById('mission-summary');
    this.codeEditor = document.getElementById('code-editor');
    this.lineNumbers = document.getElementById('line-numbers');
    this.consoleOutput = document.getElementById('console-output');
    this.hoverInfo = document.getElementById('hover-info');
    this.simControlsArea = document.getElementById('sim-controls-area');
    this.simStatusBadge = document.getElementById('sim-status-badge');
  }

  initWorkbench() {
    const svg = document.getElementById('workbench-svg');
    this.workbench = new WorkbenchUI(
      svg,
      this.circuit,
      (pin, customMsg) => this.handlePinHover(pin, customMsg),
      () => this.handleCircuitChange()
    );
    this.workbench.renderArduino(50, 70);

    // Simulation Engine hook
    this.simEngine.onStateChange = (state) => {
      this.workbench.updateSimulationVisuals(state);
      this.renderSimControls(state);
    };
  }

  attachEvents() {
    // Mission select dropdown
    this.missionSelect.addEventListener('change', (e) => {
      this.loadMission(parseInt(e.target.value, 10));
    });

    // Code Editor line numbers
    this.codeEditor.addEventListener('input', () => {
      this.updateLineNumbers();
    });
    this.codeEditor.addEventListener('scroll', () => {
      this.lineNumbers.scrollTop = this.codeEditor.scrollTop;
    });

    // Flash & Run button
    document.getElementById('btn-flash').addEventListener('click', () => {
      this.handleFlashFirmware();
    });

    // Stop Simulation button
    document.getElementById('btn-stop').addEventListener('click', () => {
      this.simEngine.stop();
      this.simStatusBadge.innerText = 'STATUS: IDLE';
      this.simStatusBadge.className = 'status-badge idle';
      this.logConsole('Simulation stopped by user.');
    });

    // Reset Wires button
    document.getElementById('btn-clear-wires').addEventListener('click', () => {
      if (confirm('Bersihkan semua sambungan kabel pada mission ini?')) {
        this.circuit.clearConnections();
        this.workbench.renderWires();
        this.simEngine.stop();
        this.logConsole('Semua kabel dibersihkan.');
      }
    });

    // Quick Hint button
    document.getElementById('btn-hint').addEventListener('click', () => {
      const m = MISSIONS[this.currentMissionIdx];
      alert(`💡 Hint Rangkaian (Misi ${m.number}):\n\n${m.hint}`);
    });
  }

  loadMission(index) {
    this.currentMissionIdx = index;
    const mission = MISSIONS[index];
    this.missionSelect.value = index;

    this.simEngine.stop();
    this.circuit.clearConnections();

    // Update UI info
    this.missionTitle.innerText = `Misi ${mission.number}: ${mission.title}`;
    this.missionSummary.innerText = mission.summary;
    this.codeEditor.value = mission.defaultFirmware;
    this.updateLineNumbers();

    // Render components
    this.workbench.renderMissionComponents(mission);

    this.simStatusBadge.innerText = 'STATUS: CIRCUIT INCOMPLETE';
    this.simStatusBadge.className = 'status-badge unverified';

    this.logConsole(`[MISSION LOADED] Misi ${mission.number}: ${mission.title}\nBaca instruksi kodingan di kiri, lalu rangkai kabel pada komponen di kanan.`);
    this.renderSimControls(this.simEngine.state);
  }

  updateLineNumbers() {
    const lines = this.codeEditor.value.split('\n').length;
    let nums = '';
    for (let i = 1; i <= lines; i++) {
      nums += i + '\n';
    }
    this.lineNumbers.innerText = nums;
  }

  handlePinHover(pin, customMsg) {
    if (customMsg) {
      this.hoverInfo.innerHTML = customMsg;
    } else if (pin) {
      this.hoverInfo.innerHTML = `Pin: <strong style="color: #facc15;">${pin.name}</strong>`;
    } else {
      this.hoverInfo.innerText = 'Arahkan kursor atau klik pin emas untuk mulai merangkai kabel.';
    }
  }

  handleCircuitChange() {
    // Stop live simulation if circuit topology is altered
    if (this.simEngine.isRunning) {
      this.simEngine.stop();
      this.simStatusBadge.innerText = 'STATUS: CIRCUIT MODIFIED';
      this.simStatusBadge.className = 'status-badge unverified';
      this.logConsole('[NOTICE] Wiring changed. Tekan "⚡ Flash & Run" untuk memverifikasi ulang.');
    }
  }

  handleFlashFirmware() {
    const mission = MISSIONS[this.currentMissionIdx];
    const code = this.codeEditor.value;

    this.logConsole('\n--- VERIFYING HARDWARE & FIRMWARE ---');
    const result = this.validator.validate(this.circuit, code, mission);

    // Render diagnostic report in console
    let output = '';
    for (const item of result.items) {
      const tag = item.pass ? '[PASS]' : '[FAIL]';
      const color = item.pass ? '#4ade80' : '#f87171';
      output += `<div style="color: ${color}; font-weight: bold;">${tag} ${item.label}</div>`;
      output += `<div style="color: #94a3b8; margin-left: 14px; margin-bottom: 6px;">${item.detail}</div>`;
    }

    if (result.hasShortCircuit) {
      this.simStatusBadge.innerText = 'CRITICAL FAULT: SHORT CIRCUIT';
      this.simStatusBadge.className = 'status-badge error';
      output += `<div style="color: #ef4444; font-weight: bold; margin-top: 8px;">💥 SIMULASI DIBATALKAN: Kerusakan hardware dicegah. Lepaskan kabel korsleting!</div>`;
      this.consoleOutput.innerHTML = output;
      return;
    }

    if (result.passed) {
      this.simStatusBadge.innerText = 'SIMULATION RUNNING (16 MHz)';
      this.simStatusBadge.className = 'status-badge success';
      output += `<div style="color: #4ade80; font-weight: bold; margin-top: 8px;">🎉 VERIFIKASI SUKSES! Firmware running. Mainkan kontrol interaktif di bawah meja rangkaian!</div>`;
      this.simEngine.start(mission, this.circuit, result);
    } else {
      this.simStatusBadge.innerText = 'STATUS: WIRING ERROR';
      this.simStatusBadge.className = 'status-badge error';
      output += `<div style="color: #f87171; font-weight: bold; margin-top: 8px;">❌ Periksa kembali sambungan kabel atau nilai #define pin di kodingan!</div>`;
      this.simEngine.stop();
    }

    this.consoleOutput.innerHTML = output;
    this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
  }

  renderSimControls(state) {
    const mission = MISSIONS[this.currentMissionIdx];
    let html = '';

    if (!this.simEngine.isRunning) {
      html = `<div style="font-size: 0.8rem; color: #64748b;">Simulasi belum aktif. Lengkapi wiring dan tekan <strong>⚡ Flash & Run</strong>.</div>`;
    } else if (mission.id === 'mission_01') {
      html = `
        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <span style="font-size: 0.82rem; color: #cbd5e1;">Test Input Fisik:</span>
          <button class="btn-action" 
            onmousedown="window.app.simEngine.setButtonState(true)" 
            onmouseup="window.app.simEngine.setButtonState(false)"
            ontouchstart="window.app.simEngine.setButtonState(true)"
            ontouchend="window.app.simEngine.setButtonState(false)"
            style="background: #0284c7; border-color: #38bdf8;">
            🔘 Tahan Tombol (Press Button)
          </button>
          <span style="font-size: 0.8rem; color: ${state.buttonPressed ? '#4ade80' : '#94a3b8'};">
            Status: ${state.buttonPressed ? 'LOW (Pressed) → LED NYALA!' : 'HIGH (Released) → LED MATI'}
          </span>
        </div>
      `;
    } else if (mission.id === 'mission_02') {
      html = `
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; width: 100%;">
          <span style="font-size: 0.82rem; color: #cbd5e1;">Geser Jarak Rintangan:</span>
          <input type="range" min="5" max="150" value="${state.obstacleDistanceCM}" 
            oninput="window.app.simEngine.setObstacleDistance(parseFloat(this.value)); document.getElementById('disp-dist').innerText = this.value + ' cm';" 
            style="flex: 1; min-width: 150px;" />
          <strong id="disp-dist" style="color: #38bdf8; font-family: monospace; font-size: 1.1rem;">${state.obstacleDistanceCM} cm</strong>
          <span style="font-size: 0.8rem; font-weight: bold; color: ${state.obstacleDistanceCM < 30 ? '#ef4444' : '#4ade80'};">
            ${state.obstacleDistanceCM < 30 ? '🚨 ALARM BUZZER AKTIF (RINTANGAN DEKAT!)' : '✅ AMAN (JARAK > 30 CM)'}
          </span>
        </div>
      `;
    } else if (mission.id === 'mission_03') {
      html = `
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <button class="btn-action" onclick="window.app.simEngine.triggerMotion()" style="background: #059669; border-color: #34d399;">
            🏃 Picu Sensor Gerak (Trigger Motion)
          </button>
          <span style="font-size: 0.82rem; color: ${state.motionDetected ? '#34d399' : '#94a3b8'};">
            Status Palang Pintu: <strong>${state.servoAngleDeg}° (${state.motionDetected ? 'TERBUKA' : 'TERTUTUP'})</strong>
          </span>
        </div>
      `;
    }

    this.simControlsArea.innerHTML = html;
  }

  logConsole(msg) {
    const d = document.createElement('div');
    d.style.marginBottom = '4px';
    d.innerText = msg;
    this.consoleOutput.appendChild(d);
    this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.app = new WireCodeApp();
});
