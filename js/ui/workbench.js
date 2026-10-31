/**
 * WireCode Interactive Circuit Workbench (SVG Renderer & Cable Physics)
 */

class WorkbenchUI {
  constructor(svgElement, circuit, onPinHover, onConnectionChange) {
    this.svg = svgElement;
    this.circuit = circuit;
    this.onPinHover = onPinHover;
    this.onConnectionChange = onConnectionChange;

    this.selectedPin = null;
    this.pinRegistry = new Map(); // pinKey -> { compId, termId, x, y, name, type }

    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    this.svg.innerHTML = `
      <defs>
        <!-- PCB Gradients -->
        <linearGradient id="arduino-pcb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#008184" />
          <stop offset="100%" stop-color="#00686b" />
        </linearGradient>

        <linearGradient id="metal-silver" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#cbd5e1" />
          <stop offset="50%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>

        <linearGradient id="servo-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0369a1" />
          <stop offset="100%" stop-color="#075985" />
        </linearGradient>

        <radialGradient id="led-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9" />
          <stop offset="40%" stop-color="#ef4444" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
        </radialGradient>

        <!-- Drop shadow for cables and components -->
        <filter id="wire-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.5" />
        </filter>

        <!-- LED bloom filter -->
        <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Layers -->
      <g id="layer-board"></g>
      <g id="layer-components"></g>
      <g id="layer-wires"></g>
      <g id="layer-pins"></g>

      <!-- Active in-progress wire -->
      <path id="active-wire-path" d="" stroke="#38bdf8" stroke-width="4" fill="none" opacity="0" stroke-linecap="round" filter="url(#wire-shadow)" />
    `;

    this.layerBoard = this.svg.querySelector('#layer-board');
    this.layerComponents = this.svg.querySelector('#layer-components');
    this.layerWires = this.svg.querySelector('#layer-wires');
    this.layerPins = this.svg.querySelector('#layer-pins');
    this.activeWirePath = this.svg.querySelector('#active-wire-path');
  }

  attachEvents() {
    this.svg.addEventListener('mousemove', (e) => {
      if (!this.selectedPin) return;
      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const d = this.makeBezierPath(this.selectedPin.x, this.selectedPin.y, mouseX, mouseY);
      this.activeWirePath.setAttribute('d', d);
    });

    this.svg.addEventListener('click', () => {
      if (this.selectedPin) {
        this.selectedPin = null;
        this.activeWirePath.setAttribute('opacity', '0');
        if (this.onPinHover) this.onPinHover(null, 'Kabel dibatalkan.');
      }
    });
  }

  /**
   * Render Arduino Uno R3 with exact physical pin coordinates and individually centered labels
   */
  renderArduino(x = 50, y = 70) {
    const pitch = 11.5;
    const yTopPin = y + 15;
    const yTopLabel = y + 36;
    const yBottomPin = y + 215;
    const yBottomLabel = y + 198;

    // Top Header: 8 pins left + gap + 8 pins right
    const topPins = [
      { id: 'AREF',    x: x + 104 + 0 * pitch, y: yTopPin, label: 'REF' },
      { id: 'GND_DIG', x: x + 104 + 1 * pitch, y: yTopPin, label: 'GND' },
      { id: 'D13',     x: x + 104 + 2 * pitch, y: yTopPin, label: '13' },
      { id: 'D12',     x: x + 104 + 3 * pitch, y: yTopPin, label: '12' },
      { id: 'D11',     x: x + 104 + 4 * pitch, y: yTopPin, label: '~11' },
      { id: 'D10',     x: x + 104 + 5 * pitch, y: yTopPin, label: '~10' },
      { id: 'D9',      x: x + 104 + 6 * pitch, y: yTopPin, label: '~9' },
      { id: 'D8',      x: x + 104 + 7 * pitch, y: yTopPin, label: '8' },
      // Gap of 6px between the two headers
      { id: 'D7',      x: x + 202 + 0 * pitch, y: yTopPin, label: '7' },
      { id: 'D6',      x: x + 202 + 1 * pitch, y: yTopPin, label: '~6' },
      { id: 'D5',      x: x + 202 + 2 * pitch, y: yTopPin, label: '~5' },
      { id: 'D4',      x: x + 202 + 3 * pitch, y: yTopPin, label: '4' },
      { id: 'D3',      x: x + 202 + 4 * pitch, y: yTopPin, label: '~3' },
      { id: 'D2',      x: x + 202 + 5 * pitch, y: yTopPin, label: '2' },
      { id: 'D1',      x: x + 202 + 6 * pitch, y: yTopPin, label: 'TX' },
      { id: 'D0',      x: x + 202 + 7 * pitch, y: yTopPin, label: 'RX' },
    ];

    // Bottom Power: 7 pins
    const bottomPowerPins = [
      { id: 'IOREF', x: x + 104 + 0 * pitch, y: yBottomPin, label: 'IO' },
      { id: 'RESET', x: x + 104 + 1 * pitch, y: yBottomPin, label: 'RST' },
      { id: '3V3',   x: x + 104 + 2 * pitch, y: yBottomPin, label: '3V3' },
      { id: '5V',    x: x + 104 + 3 * pitch, y: yBottomPin, label: '5V' },
      { id: 'GND_1', x: x + 104 + 4 * pitch, y: yBottomPin, label: 'GND' },
      { id: 'GND_2', x: x + 104 + 5 * pitch, y: yBottomPin, label: 'GND' },
      { id: 'VIN',   x: x + 104 + 6 * pitch, y: yBottomPin, label: 'VIN' },
    ];

    // Bottom Analog: 6 pins
    const bottomAnalogPins = [
      { id: 'A0', x: x + 202 + 0 * pitch, y: yBottomPin, label: 'A0' },
      { id: 'A1', x: x + 202 + 1 * pitch, y: yBottomPin, label: 'A1' },
      { id: 'A2', x: x + 202 + 2 * pitch, y: yBottomPin, label: 'A2' },
      { id: 'A3', x: x + 202 + 3 * pitch, y: yBottomPin, label: 'A3' },
      { id: 'A4', x: x + 202 + 4 * pitch, y: yBottomPin, label: 'A4' },
      { id: 'A5', x: x + 202 + 5 * pitch, y: yBottomPin, label: 'A5' },
    ];

    // Generate individual centered SVG text labels
    let topLabelsSvg = '';
    topPins.forEach(p => {
      const isPwm = p.label.startsWith('~');
      const color = isPwm ? '#38bdf8' : (p.label === 'REF' || p.label === 'GND' ? '#94a3b8' : '#f8fafc');
      topLabelsSvg += `<text x="${p.x}" y="${yTopLabel}" text-anchor="middle" font-family="monospace" font-size="7.5" font-weight="bold" fill="${color}">${p.label}</text>`;
    });

    let bottomPowerLabelsSvg = '';
    bottomPowerPins.forEach(p => {
      const color = p.label.includes('5V') || p.label.includes('3V') ? '#ef4444' : (p.label.includes('GND') ? '#94a3b8' : '#f8fafc');
      bottomPowerLabelsSvg += `<text x="${p.x}" y="${yBottomLabel}" text-anchor="middle" font-family="monospace" font-size="7.5" font-weight="bold" fill="${color}">${p.label}</text>`;
    });

    let bottomAnalogLabelsSvg = '';
    bottomAnalogPins.forEach(p => {
      bottomAnalogLabelsSvg += `<text x="${p.x}" y="${yBottomLabel}" text-anchor="middle" font-family="monospace" font-size="7.5" font-weight="bold" fill="#38bdf8">${p.label}</text>`;
    });

    this.layerBoard.innerHTML = `
      <g id="arduino-uno-group" transform="translate(${x}, ${y})" filter="url(#wire-shadow)">
        <!-- Main PCB -->
        <rect x="0" y="0" width="310" height="230" rx="14" fill="url(#arduino-pcb)" stroke="#004d4f" stroke-width="2" />
        <rect x="8" y="8" width="294" height="214" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />

        <!-- Silkscreen -->
        <text x="135" y="115" fill="rgba(255,255,255,0.7)" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="1">ARDUINO</text>
        <text x="145" y="132" fill="rgba(255,255,255,0.5)" font-family="monospace" font-size="10">UNO R3</text>
        
        <!-- USB Type-B Port -->
        <rect x="-8" y="24" width="56" height="44" rx="4" fill="url(#metal-silver)" stroke="#64748b" stroke-width="1.5" />
        <rect x="-12" y="32" width="6" height="28" rx="2" fill="#475569" />
        <rect x="8" y="34" width="30" height="24" rx="2" fill="#1e293b" />

        <!-- DC Power Jack -->
        <rect x="-8" y="150" width="54" height="50" rx="3" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <circle cx="18" cy="175" r="8" fill="#475569" />
        <circle cx="18" cy="175" r="3.5" fill="#94a3b8" />

        <!-- ATmega328P DIP-28 Chip -->
        <rect x="130" y="145" width="135" height="42" rx="4" fill="#090d16" stroke="#1e293b" stroke-width="1.5" />
        <path d="M 130 160 A 6 6 0 0 1 130 172 Z" fill="#1e293b" />
        <text x="148" y="170" fill="#64748b" font-family="monospace" font-size="9" letter-spacing="0.5">ATMEGA328P-PU</text>

        <!-- 16MHz Crystal -->
        <rect x="78" y="105" width="22" height="12" rx="5" fill="url(#metal-silver)" stroke="#64748b" stroke-width="1" />
        <text x="82" y="114" fill="#334155" font-family="monospace" font-size="6">16M</text>

        <!-- Reset Button -->
        <circle cx="68" cy="38" r="7" fill="#334155" />
        <circle cx="68" cy="38" r="4" fill="#dc2626" />

        <!-- Status LEDs -->
        <rect x="90" y="70" width="6" height="4" fill="#15803d" />
        <text x="88" y="82" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="6">ON</text>
        <rect x="110" y="70" width="6" height="4" fill="#78350f" id="board-led-l" />
        <text x="111" y="82" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="6">L</text>

        <!-- Top Header Female Plastic Housings (2 strips separated by small physical gap) -->
        <rect x="98" y="6" width="98" height="18" fill="#111827" stroke="#374151" stroke-width="1" rx="2" />
        <rect x="196" y="6" width="98" height="18" fill="#111827" stroke="#374151" stroke-width="1" rx="2" />

        <!-- Bottom Header 1: Power Plastic Housing -->
        <rect x="98" y="206" width="87" height="18" fill="#111827" stroke="#374151" stroke-width="1" rx="2" />

        <!-- Bottom Header 2: Analog Plastic Housing -->
        <rect x="196" y="206" width="76" height="18" fill="#111827" stroke="#374151" stroke-width="1" rx="2" />
      </g>

      <!-- Centered Pin Labels Directly Aligned with each pin hole -->
      <g id="arduino-pin-labels">
        ${topLabelsSvg}
        ${bottomPowerLabelsSvg}
        ${bottomAnalogLabelsSvg}
      </g>
    `;

    [...topPins, ...bottomPowerPins, ...bottomAnalogPins].forEach(p => {
      this.registerPin('arduino', p.id, p.x, p.y, `Arduino ${p.id}`, ARDUINO_UNO_R3.pins[p.id]);
    });
  }

  registerPin(compId, termId, x, y, name, meta = {}) {
    const key = `${compId}:${termId}`;
    this.pinRegistry.set(key, { compId, termId, x, y, name, meta });
  }

  /**
   * Render all components for current mission
   */
  renderMissionComponents(mission) {
    this.layerComponents.innerHTML = '';
    // Clear non-arduino pins from registry
    for (const [key, val] of this.pinRegistry.entries()) {
      if (val.compId !== 'arduino') {
        this.pinRegistry.delete(key);
      }
    }

    mission.components.forEach(item => {
      const { instanceId, typeId, x, y } = item;
      const def = COMPONENT_DEFINITIONS[typeId];
      this.circuit.addComponent(instanceId, typeId, def, x, y);

      if (typeId === 'led_red') {
        this.renderLed(instanceId, x, y);
      } else if (typeId === 'resistor_220') {
        this.renderResistor(instanceId, x, y);
      } else if (typeId === 'pushbutton') {
        this.renderPushbutton(instanceId, x, y);
      } else if (typeId === 'hc_sr04') {
        this.renderUltrasonic(instanceId, x, y);
      } else if (typeId === 'buzzer_piezo') {
        this.renderBuzzer(instanceId, x, y);
      } else if (typeId === 'servo_sg90') {
        this.renderServo(instanceId, x, y);
      } else if (typeId === 'pir_sensor') {
        this.renderPir(instanceId, x, y);
      }
    });

    this.renderPinTargets();
    this.renderWires();
  }

  renderLed(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <circle id="${id}-aura" cx="30" cy="25" r="34" fill="url(#led-glow-grad)" opacity="0" />
      <g transform="translate(30, 25)">
        <path id="${id}-bulb" d="M -14, 0 A 14 14 0 0 1 14, 0 L 14, 16 L -14, 16 Z" fill="#b91c1c" stroke="#dc2626" stroke-width="1.5" />
        <rect x="-16" y="16" width="32" height="4" rx="1.5" fill="#991b1b" />
        <ellipse cx="-5" cy="-3" rx="3" ry="5" fill="rgba(255,255,255,0.4)" transform="rotate(-25 -5 -3)" />
      </g>
      <!-- Anode Leg (Long with slight bend) -->
      <path d="M 25 45 L 25 65 L 20 75 L 20 100" stroke="url(#metal-silver)" stroke-width="2.5" fill="none" />
      <!-- Cathode Leg (Short) -->
      <path d="M 35 45 L 35 100" stroke="url(#metal-silver)" stroke-width="2.5" fill="none" />
      <text x="20" y="112" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5">ANODE(+)</text>
      <text x="40" y="112" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5">CATHODE(-)</text>
    `;
    this.layerComponents.appendChild(g);

    this.registerPin(id, 'anode', x + 20, y + 100, 'LED Anode (+)');
    this.registerPin(id, 'cathode', x + 35, y + 100, 'LED Cathode (-)');
  }

  renderResistor(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <line x1="10" y1="40" x2="10" y2="10" stroke="url(#metal-silver)" stroke-width="2.5" />
      <line x1="10" y1="80" x2="10" y2="110" stroke="url(#metal-silver)" stroke-width="2.5" />
      <rect x="0" y="40" width="20" height="40" rx="5" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2" />
      <rect x="0" y="46" width="20" height="3" fill="#dc2626" />
      <rect x="0" y="54" width="20" height="3" fill="#dc2626" />
      <rect x="0" y="62" width="20" height="3" fill="#78350f" />
      <rect x="0" y="71" width="20" height="2.5" fill="#eab308" />
      <text x="10" y="32" text-anchor="middle" fill="#e2e8f0" font-family="monospace" font-size="8.5" font-weight="bold">220Ω</text>
    `;
    this.layerComponents.appendChild(g);

    this.registerPin(id, 'T1', x + 10, y + 10, 'Resistor Terminal 1');
    this.registerPin(id, 'T2', x + 10, y + 110, 'Resistor Terminal 2');
  }

  renderPushbutton(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <rect x="0" y="0" width="55" height="55" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
      <circle id="${id}-plunger" cx="27.5" cy="27.5" r="16" fill="#0f172a" stroke="#64748b" stroke-width="1.5" style="cursor: pointer; transition: 0.1s;" />
      <circle cx="27.5" cy="27.5" r="12" fill="#3b82f6" />
      <!-- Metal Pins -->
      <line x1="10" y1="55" x2="10" y2="70" stroke="url(#metal-silver)" stroke-width="3" />
      <line x1="45" y1="55" x2="45" y2="70" stroke="url(#metal-silver)" stroke-width="3" />
      <text x="10" y="82" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5">T1</text>
      <text x="45" y="82" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5">T2</text>
    `;
    this.layerComponents.appendChild(g);

    const plunger = g.querySelector(`#${id}-plunger`);
    plunger.addEventListener('mousedown', () => window.app && window.app.simEngine.setButtonState(true));
    plunger.addEventListener('mouseup', () => window.app && window.app.simEngine.setButtonState(false));
    plunger.addEventListener('touchstart', () => window.app && window.app.simEngine.setButtonState(true));
    plunger.addEventListener('touchend', () => window.app && window.app.simEngine.setButtonState(false));

    this.registerPin(id, 'T1', x + 10, y + 70, 'Pushbutton Terminal A');
    this.registerPin(id, 'T2', x + 45, y + 70, 'Pushbutton Terminal B');
  }

  renderUltrasonic(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <rect x="0" y="0" width="160" height="85" rx="8" fill="#1d4ed8" stroke="#1e40af" stroke-width="1.5" />
      <text x="50" y="16" fill="rgba(255,255,255,0.7)" font-family="monospace" font-size="9" font-weight="bold">HC-SR04</text>
      <!-- Transducer T -->
      <g transform="translate(38, 45)">
        <circle cx="0" cy="0" r="26" fill="url(#metal-silver)" stroke="#475569" stroke-width="1.5" />
        <circle cx="0" cy="0" r="20" fill="#0f172a" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#64748b" stroke-width="1" />
        <text x="-4" y="4" fill="#fff" font-family="sans-serif" font-size="9" font-weight="bold">T</text>
      </g>
      <!-- Transducer R -->
      <g transform="translate(122, 45)">
        <circle cx="0" cy="0" r="26" fill="url(#metal-silver)" stroke="#475569" stroke-width="1.5" />
        <circle cx="0" cy="0" r="20" fill="#0f172a" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#64748b" stroke-width="1" />
        <text x="-4" y="4" fill="#fff" font-family="sans-serif" font-size="9" font-weight="bold">R</text>
      </g>
      <!-- Soundwave animation arc -->
      <path id="${id}-ping" d="M 40 10 A 35 35 0 0 1 120 10" stroke="#38bdf8" stroke-width="2.5" fill="none" opacity="0" />
      <text x="44" y="77" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="7.5">VCC</text>
      <text x="68" y="77" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="7.5">TRIG</text>
      <text x="94" y="77" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="7.5">ECHO</text>
      <text x="120" y="77" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="7.5">GND</text>
    `;
    this.layerComponents.appendChild(g);

    this.registerPin(id, 'VCC',  x + 44, y + 85, 'HC-SR04: VCC (5V)');
    this.registerPin(id, 'TRIG', x + 68, y + 85, 'HC-SR04: TRIG (Input Pulse)');
    this.registerPin(id, 'ECHO', x + 94, y + 85, 'HC-SR04: ECHO (Output Pulse)');
    this.registerPin(id, 'GND',  x + 120, y + 85, 'HC-SR04: GND');
  }

  renderBuzzer(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <circle cx="35" cy="35" r="30" fill="#0f172a" stroke="#334155" stroke-width="2" />
      <circle id="${id}-bezel" cx="35" cy="35" r="18" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
      <circle cx="35" cy="35" r="5" fill="#000" />
      <text x="25" y="22" fill="#ef4444" font-family="sans-serif" font-size="10" font-weight="bold">+</text>
      <!-- Terminals -->
      <line x1="20" y1="65" x2="20" y2="80" stroke="url(#metal-silver)" stroke-width="2.5" />
      <line x1="50" y1="65" x2="50" y2="80" stroke="url(#metal-silver)" stroke-width="2.5" />
      <text x="20" y="92" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5">POS(+)</text>
      <text x="50" y="92" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5">NEG(-)</text>
    `;
    this.layerComponents.appendChild(g);

    this.registerPin(id, 'positive', x + 20, y + 80, 'Piezo Buzzer Positive (+)');
    this.registerPin(id, 'negative', x + 50, y + 80, 'Piezo Buzzer Negative (-)');
  }

  renderServo(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <rect x="0" y="25" width="115" height="65" rx="5" fill="url(#servo-body)" stroke="#0284c7" stroke-width="1.5" />
      <circle cx="32" cy="25" r="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
      <!-- Servo Horn -->
      <g id="${id}-horn" transform="translate(32, 25) rotate(0)">
        <path d="M -7, -5 L 50, -2 L 50, 2 L -7, 5 A 7 7 0 0 1 -7 -5 Z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.2" />
        <circle cx="0" cy="0" r="4" fill="#475569" />
      </g>
      <text x="32" y="70" fill="#fff" font-family="monospace" font-size="10" font-weight="bold">SG90 9g</text>
      <!-- Wire leads -->
      <text x="10" y="106" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7">GND</text>
      <text x="26" y="106" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7">5V</text>
      <text x="42" y="106" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7">SIG</text>
    `;
    this.layerComponents.appendChild(g);

    this.registerPin(id, 'ground', x + 10, y + 95, 'Servo Ground (Brown)');
    this.registerPin(id, 'power',  x + 26, y + 95, 'Servo Power 5V (Red)');
    this.registerPin(id, 'signal', x + 42, y + 95, 'Servo Signal PWM (Orange)');
  }

  renderPir(id, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('filter', 'url(#wire-shadow)');
    g.innerHTML = `
      <rect x="0" y="0" width="100" height="75" rx="6" fill="#15803d" stroke="#166534" stroke-width="1.5" />
      <circle cx="50" cy="35" r="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
      <!-- Fresnel pattern -->
      <circle cx="50" cy="35" r="15" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" />
      <text x="18" y="15" fill="#dcfce7" font-family="monospace" font-size="8" font-weight="bold">HC-SR501 PIR</text>
      <text x="25" y="70" text-anchor="middle" fill="#fff" font-family="monospace" font-size="7.5">VCC</text>
      <text x="48" y="70" text-anchor="middle" fill="#fff" font-family="monospace" font-size="7.5">OUT</text>
      <text x="72" y="70" text-anchor="middle" fill="#fff" font-family="monospace" font-size="7.5">GND</text>
    `;
    this.layerComponents.appendChild(g);

    this.registerPin(id, 'VCC', x + 25, y + 75, 'PIR VCC (+5V)');
    this.registerPin(id, 'OUT', x + 48, y + 75, 'PIR Output (Digital Signal)');
    this.registerPin(id, 'GND', x + 72, y + 75, 'PIR GND (Ground)');
  }

  /**
   * Render interactive touch/click hitboxes for all registered pins
   */
  renderPinTargets() {
    this.layerPins.innerHTML = '';

    for (const [key, p] of this.pinRegistry.entries()) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'pin-target');

      // 1. Invisible large hit target (easy clicking on tablet/mobile)
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hit.setAttribute('cx', p.x); hit.setAttribute('cy', p.y);
      hit.setAttribute('r', '14'); hit.setAttribute('fill', 'transparent');

      // 2. Glow effect on hover
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', p.x); glow.setAttribute('cy', p.y);
      glow.setAttribute('r', '8'); glow.setAttribute('fill', '#facc15');
      glow.setAttribute('opacity', '0'); glow.setAttribute('class', 'pin-glow');

      // 3. Visible pin core directly sitting in the socket hole
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('cx', p.x); core.setAttribute('cy', p.y);
      core.setAttribute('r', '3.8'); core.setAttribute('fill', '#0f172a');
      core.setAttribute('stroke', '#fbbf24'); core.setAttribute('stroke-width', '1.5');
      core.setAttribute('class', 'pin-core');

      g.appendChild(hit);
      g.appendChild(glow);
      g.appendChild(core);

      g.addEventListener('mouseenter', () => {
        if (this.onPinHover) this.onPinHover(p, `Pin: ${p.name}`);
      });
      g.addEventListener('mouseleave', () => {
        if (this.onPinHover && !this.selectedPin) this.onPinHover(null);
      });

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handlePinClick(p);
      });

      this.layerPins.appendChild(g);
    }
  }

  handlePinClick(pin) {
    if (!this.selectedPin) {
      // Start wire
      this.selectedPin = pin;
      this.activeWirePath.setAttribute('opacity', '1');
      if (this.onPinHover) this.onPinHover(pin, `Tarik kabel dari ${pin.name} -> Klik pin tujuan`);
    } else {
      // End wire
      if (this.selectedPin.compId !== pin.compId || this.selectedPin.termId !== pin.termId) {
        const color = this.pickWireColor(this.selectedPin.termId, pin.termId);
        const res = this.circuit.addConnection(
          this.selectedPin.compId, this.selectedPin.termId,
          pin.compId, pin.termId,
          color
        );
        if (res.success) {
          this.renderWires();
          if (this.onConnectionChange) this.onConnectionChange();
          if (this.onPinHover) this.onPinHover(null, `Tersambung: ${this.selectedPin.name} ↔ ${pin.name}`);
        } else {
          if (this.onPinHover) this.onPinHover(null, `Error: ${res.error}`);
        }
      }
      this.selectedPin = null;
      this.activeWirePath.setAttribute('opacity', '0');
    }
  }

  renderWires() {
    this.layerWires.innerHTML = '';

    for (const conn of this.circuit.connections) {
      const srcPin = this.pinRegistry.get(`${conn.source.componentId}:${conn.source.terminalId}`);
      const tgtPin = this.pinRegistry.get(`${conn.target.componentId}:${conn.target.terminalId}`);

      if (!srcPin || !tgtPin) continue;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('filter', 'url(#wire-shadow)');
      g.setAttribute('style', 'cursor: pointer;');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', this.makeBezierPath(srcPin.x, srcPin.y, tgtPin.x, tgtPin.y));
      path.setAttribute('stroke', conn.color || '#eab308');
      path.setAttribute('stroke-width', '4');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');

      // Click wire to delete
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Hapus kabel ${srcPin.name} ↔ ${tgtPin.name}?`)) {
          this.circuit.removeConnection(conn.id);
          this.renderWires();
          if (this.onConnectionChange) this.onConnectionChange();
        }
      });

      // Terminal DuPont caps
      const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c1.setAttribute('cx', srcPin.x); c1.setAttribute('cy', srcPin.y); c1.setAttribute('r', '4.5');
      c1.setAttribute('fill', '#0f172a'); c1.setAttribute('stroke', conn.color); c1.setAttribute('stroke-width', '1.5');

      const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c2.setAttribute('cx', tgtPin.x); c2.setAttribute('cy', tgtPin.y); c2.setAttribute('r', '4.5');
      c2.setAttribute('fill', '#0f172a'); c2.setAttribute('stroke', conn.color); c2.setAttribute('stroke-width', '1.5');

      g.appendChild(path);
      g.appendChild(c1);
      g.appendChild(c2);
      this.layerWires.appendChild(g);
    }
  }

  makeBezierPath(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sag = Math.min(80, dist * 0.35);

    const cx1 = x1 + dx * 0.25;
    const cy1 = y1 + dy * 0.25 + sag;
    const cx2 = x1 + dx * 0.75;
    const cy2 = y1 + dy * 0.75 + sag;

    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  pickWireColor(t1, t2) {
    const s = `${t1} ${t2}`.toUpperCase();
    if (s.includes('GND')) return '#1e293b'; // Black
    if (s.includes('5V') || s.includes('VCC') || s.includes('ANODE') || s.includes('POWER')) return '#dc2626'; // Red
    if (s.includes('TRIG')) return '#0284c7'; // Cyan
    if (s.includes('ECHO')) return '#9333ea'; // Purple
    if (s.includes('SIGNAL') || s.includes('ORANGE')) return '#ea580c'; // Orange
    return '#eab308'; // Yellow
  }

  /**
   * Update visual animations based on simulation state
   */
  updateSimulationVisuals(state) {
    // Mission 1: LED & SMD L
    const aura = document.getElementById('led1-aura');
    const bulb = document.getElementById('led1-bulb');
    const smdL = document.getElementById('board-led-l');

    if (aura && bulb) {
      if (state.ledOn) {
        aura.setAttribute('opacity', '1');
        bulb.setAttribute('fill', '#ef4444');
        bulb.setAttribute('filter', 'url(#bloom)');
        if (smdL) smdL.setAttribute('fill', '#f59e0b');
      } else {
        aura.setAttribute('opacity', '0');
        bulb.setAttribute('fill', '#b91c1c');
        bulb.removeAttribute('filter');
        if (smdL) smdL.setAttribute('fill', '#78350f');
      }
    }

    // Mission 2: HC-SR04 sound wave ping & Buzzer
    const ping = document.getElementById('sonar1-ping');
    if (ping) {
      ping.setAttribute('opacity', state.pingWaveActive ? '1' : '0');
    }
    const buzzerBezel = document.getElementById('buzzer1-bezel');
    if (buzzerBezel) {
      buzzerBezel.setAttribute('fill', state.buzzerBeeping ? '#ef4444' : '#1e293b');
    }

    // Mission 3: Servo Horn Rotation
    const servoHorn = document.getElementById('servo1-horn');
    if (servoHorn) {
      servoHorn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      servoHorn.setAttribute('transform', `translate(32, 25) rotate(${state.servoAngleDeg})`);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorkbenchUI };
}
