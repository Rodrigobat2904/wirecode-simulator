/**
 * WireCode Circuit State Model
 * Stores structured topology and logical netlist connections.
 */

class Connection {
  constructor(id, source, target, color = null) {
    this.id = id;
    // source: { componentId, terminalId }
    this.source = source;
    // target: { componentId, terminalId }
    this.target = target;
    this.color = color;
    this.timestamp = Date.now();
  }

  touches(componentId, terminalId = null) {
    const srcMatch = this.source.componentId === componentId && (terminalId === null || this.source.terminalId === terminalId);
    const tgtMatch = this.target.componentId === componentId && (terminalId === null || this.target.terminalId === terminalId);
    return srcMatch || tgtMatch;
  }

  getOtherEnd(componentId, terminalId) {
    if (this.source.componentId === componentId && this.source.terminalId === terminalId) {
      return this.target;
    }
    if (this.target.componentId === componentId && this.target.terminalId === terminalId) {
      return this.source;
    }
    return null;
  }
}

class Circuit {
  constructor(boardProfile) {
    this.board = boardProfile;
    // instanceId -> { instanceId, typeId, definition, x, y }
    this.components = new Map();
    // Array of Connection
    this.connections = [];
    this.connIdCounter = 1;
  }

  addComponent(instanceId, typeId, componentDef, x = 0, y = 0) {
    this.components.set(instanceId, {
      instanceId,
      typeId,
      definition: componentDef,
      x,
      y
    });
  }

  removeComponent(instanceId) {
    // Remove attached connections
    this.connections = this.connections.filter(c => !c.touches(instanceId));
    this.components.delete(instanceId);
  }

  addConnection(sourceCompId, sourceTermId, targetCompId, targetTermId, preferredColor = null) {
    // Prevent self-loop
    if (sourceCompId === targetCompId && sourceTermId === targetTermId) {
      return { success: false, error: 'Cannot connect a terminal to itself.' };
    }

    // Prevent duplicate connection
    const exists = this.connections.some(c => 
      (c.touches(sourceCompId, sourceTermId) && c.touches(targetCompId, targetTermId))
    );
    if (exists) {
      return { success: false, error: 'Connection already exists between these terminals.' };
    }

    const id = `wire_${this.connIdCounter++}`;
    const conn = new Connection(
      id,
      { componentId: sourceCompId, terminalId: sourceTermId },
      { componentId: targetCompId, terminalId: targetTermId },
      preferredColor
    );
    this.connections.push(conn);
    return { success: true, connection: conn };
  }

  removeConnection(connectionId) {
    const idx = this.connections.findIndex(c => c.id === connectionId);
    if (idx !== -1) {
      this.connections.splice(idx, 1);
      return true;
    }
    return false;
  }

  clearConnections() {
    this.connections = [];
  }

  getConnectionsFor(componentId, terminalId = null) {
    return this.connections.filter(c => c.touches(componentId, terminalId));
  }

  /**
   * Find where a specific terminal is directly connected.
   * Returns list of { componentId, terminalId }
   */
  getDirectPartners(componentId, terminalId) {
    const partners = [];
    for (const c of this.connections) {
      const other = c.getOtherEnd(componentId, terminalId);
      if (other) partners.push(other);
    }
    return partners;
  }

  /**
   * Trace continuity across 2-terminal passive elements (e.g. Resistor, Switch).
   * Useful for tracing D5 -> Resistor -> LED Anode -> LED Cathode -> GND.
   */
  traceContinuity(startComp, startTerm, visited = new Set()) {
    const key = `${startComp}:${startTerm}`;
    if (visited.has(key)) return [];
    visited.add(key);

    const reachable = [{ componentId: startComp, terminalId: startTerm }];
    const direct = this.getDirectPartners(startComp, startTerm);

    for (const partner of direct) {
      reachable.push(partner);
      const comp = this.components.get(partner.componentId);

      // If partner is a resistor (bilateral passive) or closed switch, pass through to opposite terminal!
      if (comp && comp.typeId.startsWith('resistor')) {
        const otherTerm = partner.terminalId === 'T1' ? 'T2' : 'T1';
        const subReachable = this.traceContinuity(partner.componentId, otherTerm, visited);
        reachable.push(...subReachable);
      }
    }

    return reachable;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Connection, Circuit };
}
