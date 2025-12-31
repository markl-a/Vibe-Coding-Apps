/**
 * Quantum Simulation Examples
 *
 * This file demonstrates quantum simulation of physical systems:
 * - Hamiltonian simulation
 * - Time evolution of quantum systems
 * - Spin chain dynamics
 * - Molecular simulation (simplified)
 * - Trotter decomposition
 * - Quantum chemistry basics
 * - Many-body physics
 */

import { QuantumSimulator } from '../quantum-algorithms/quantum-simulator/src/simulator.js';
import type { QuantumCircuit, GateOperation } from '../quantum-algorithms/quantum-simulator/src/types.js';

// ============================================================================
// Example 1: Single Spin Dynamics
// ============================================================================

function example1_SingleSpinDynamics(): void {
  console.log('\n=== Example 1: Single Spin Dynamics ===\n');

  console.log('Simulating evolution of a single spin under Hamiltonian H = ωX');
  console.log('(Spin precession around X-axis)\n');

  const omega = 1.0; // Angular frequency
  const times = [0, 0.5, 1.0, 1.5, 2.0];

  console.log('Time evolution of initial state |0⟩:');

  times.forEach(t => {
    const sim = new QuantumSimulator(1);

    // Start in |0⟩
    // Time evolution: U(t) = e^(-iHt) = e^(-iωXt)
    // For H = ωX, this is just Rx(2ωt)
    const angle = 2 * omega * t;
    sim.executeOperation({ gate: 'Rx', targets: [0], params: [angle] });

    const probs = sim.getProbabilities();
    console.log(`  t = ${t.toFixed(1)}: P(0) = ${(probs[0] * 100).toFixed(1)}%, P(1) = ${(probs[1] * 100).toFixed(1)}%`);
    console.log(`             State: ${sim.stateToString()}`);
  });

  console.log('\nObservation: Spin oscillates between |0⟩ and |1⟩');
  console.log('This is quantum analog of classical precession!');
}

// ============================================================================
// Example 2: Two-Spin Interaction
// ============================================================================

function example2_TwoSpinInteraction(): void {
  console.log('\n=== Example 2: Two-Spin Interaction ===\n');

  console.log('Simulating Ising interaction: H = J·Z₁Z₂');
  console.log('(Ferromagnetic coupling when J < 0)\n');

  const J = -0.5; // Coupling strength
  const t = 1.0; // Evolution time

  console.log('Initial states and their evolution:\n');

  const initialStates = [
    { name: '|00⟩', ops: [] as GateOperation[] },
    { name: '|01⟩', ops: [{ gate: 'X' as const, targets: [1] }] },
    { name: '|10⟩', ops: [{ gate: 'X' as const, targets: [0] }] },
    { name: '|11⟩', ops: [{ gate: 'X' as const, targets: [0] }, { gate: 'X' as const, targets: [1] }] },
  ];

  initialStates.forEach(({ name, ops }) => {
    const sim = new QuantumSimulator(2);

    // Prepare initial state
    ops.forEach(op => sim.executeOperation(op));

    const before = sim.stateToString();

    // Time evolution under ZZ interaction
    // e^(-iJZ₁Z₂t) can be implemented using CNOT gates and Rz
    sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
    sim.executeOperation({ gate: 'Rz', targets: [1], params: [2 * J * t] });
    sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });

    console.log(`  ${name} → ${sim.stateToString()}`);
  });

  console.log('\nPhysical interpretation:');
  console.log('  - Aligned spins (|00⟩, |11⟩) prefer to stay aligned');
  console.log('  - Anti-aligned spins (|01⟩, |10⟩) gain relative phase');
  console.log('  - This models magnetic interactions in materials');
}

// ============================================================================
// Example 3: Spin Chain Dynamics
// ============================================================================

function example3_SpinChainDynamics(): void {
  console.log('\n=== Example 3: Spin Chain Dynamics ===\n');

  console.log('Simulating 1D Heisenberg spin chain:');
  console.log('H = J·Σᵢ(XᵢXᵢ₊₁ + YᵢYᵢ₊₁ + ZᵢZᵢ₊₁)\n');

  const numSpins = 3;
  const J = 1.0;
  const dt = 0.1; // Small time step

  console.log(`Chain of ${numSpins} spins with nearest-neighbor interactions\n`);

  const sim = new QuantumSimulator(numSpins);

  // Initialize with domain wall: |100⟩
  sim.executeOperation({ gate: 'X', targets: [0] });

  console.log('Initial state (domain wall):', sim.stateToString());

  // Simplified evolution (one XX interaction)
  // XX interaction can be done with: H-CNOT-H sequence
  console.log('\nAfter nearest-neighbor XX interaction:');

  for (let i = 0; i < numSpins - 1; i++) {
    // XX coupling between spins i and i+1 (simplified)
    sim.executeOperation({ gate: 'H', targets: [i] });
    sim.executeOperation({ gate: 'H', targets: [i + 1] });
    sim.executeOperation({ gate: 'CNOT', targets: [i + 1], controls: [i] });
    sim.executeOperation({ gate: 'Rz', targets: [i + 1], params: [2 * J * dt] });
    sim.executeOperation({ gate: 'CNOT', targets: [i + 1], controls: [i] });
    sim.executeOperation({ gate: 'H', targets: [i] });
    sim.executeOperation({ gate: 'H', targets: [i + 1] });
  }

  console.log('  State:', sim.stateToString());

  const probs = sim.getProbabilities();
  console.log('\n  Probability distribution:');
  probs.forEach((prob, idx) => {
    if (prob > 0.01) {
      const basis = idx.toString(2).padStart(numSpins, '0');
      console.log(`    |${basis}⟩: ${(prob * 100).toFixed(1)}%`);
    }
  });

  console.log('\nPhysical meaning:');
  console.log('  - Excitation can hop between neighboring spins');
  console.log('  - Models quantum magnets and spin transport');
  console.log('  - Important for understanding quantum materials');
}

// ============================================================================
// Example 4: Trotter Decomposition
// ============================================================================

function example4_TrotterDecomposition(): void {
  console.log('\n=== Example 4: Trotter Decomposition ===\n');

  console.log('Simulating H = H₁ + H₂ using Trotter-Suzuki formula:');
  console.log('e^(-i(H₁+H₂)t) ≈ [e^(-iH₁Δt)e^(-iH₂Δt)]^(t/Δt)\n');

  console.log('Example: H = X + Z on single qubit');

  const totalTime = 1.0;
  const steps = [1, 2, 5, 10];

  console.log('Convergence with increasing Trotter steps:\n');

  steps.forEach(numSteps => {
    const sim = new QuantumSimulator(1);
    const dt = totalTime / numSteps;

    for (let step = 0; step < numSteps; step++) {
      // e^(-iX·dt)
      sim.executeOperation({ gate: 'Rx', targets: [0], params: [2 * dt] });
      // e^(-iZ·dt)
      sim.executeOperation({ gate: 'Rz', targets: [0], params: [2 * dt] });
    }

    const probs = sim.getProbabilities();
    console.log(`  Steps: ${numSteps.toString().padStart(2)}, dt=${dt.toFixed(3)}: P(0)=${(probs[0] * 100).toFixed(1)}%, P(1)=${(probs[1] * 100).toFixed(1)}%`);
  });

  console.log('\nTrotter-Suzuki methods:');
  console.log('  - First order: e^(-i(H₁+H₂)Δt) ≈ e^(-iH₁Δt)e^(-iH₂Δt)');
  console.log('  - Second order: ... ≈ e^(-iH₁Δt/2)e^(-iH₂Δt)e^(-iH₁Δt/2)');
  console.log('  - Higher order methods reduce error');
  console.log('  - Essential for quantum simulation algorithms');
}

// ============================================================================
// Example 5: Hydrogen Molecule Simulation (Simplified)
// ============================================================================

function example5_HydrogenMolecule(): void {
  console.log('\n=== Example 5: Hydrogen Molecule (H₂) Simulation ===\n');

  console.log('Simplified H₂ molecule using 2 qubits');
  console.log('(Each qubit represents molecular orbital occupation)\n');

  console.log('Molecular Hamiltonian (simplified):');
  console.log('  H = E₀·I + E₁·Z₁ + E₂·Z₂ + E₁₂·Z₁Z₂');
  console.log('  (Energy terms for different electron configurations)\n');

  // Simplified coefficients (not physical values)
  const E0 = -1.0;
  const E1 = 0.5;
  const E2 = 0.5;
  const E12 = -0.3;

  console.log('Finding ground state using VQE approach:\n');

  function createMolecularAnsatz(theta1: number, theta2: number): QuantumCircuit {
    return {
      name: 'Molecular Ansatz',
      numQubits: 2,
      operations: [
        { gate: 'Ry', targets: [0], params: [theta1] },
        { gate: 'Ry', targets: [1], params: [theta2] },
        { gate: 'CNOT', targets: [1], controls: [0] },
      ],
    };
  }

  function measureEnergy(sim: QuantumSimulator): number {
    const probs = sim.getProbabilities();
    // Energy expectation value (simplified)
    return (
      E0 +
      E1 * (probs[0] + probs[1] - probs[2] - probs[3]) +
      E2 * (probs[0] + probs[2] - probs[1] - probs[3]) +
      E12 * (probs[0] - probs[1] - probs[2] + probs[3])
    );
  }

  const paramGrid = [
    [0, 0],
    [Math.PI / 4, Math.PI / 4],
    [Math.PI / 2, Math.PI / 2],
  ];

  let minEnergy = Infinity;
  let bestParams = [0, 0];

  console.log('Parameter scan:');
  paramGrid.forEach(([theta1, theta2]) => {
    const circuit = createMolecularAnsatz(theta1, theta2);
    const sim = new QuantumSimulator(2);
    sim.executeCircuit(circuit);

    const energy = measureEnergy(sim);
    if (energy < minEnergy) {
      minEnergy = energy;
      bestParams = [theta1, theta2];
    }

    console.log(`  θ₁=${(theta1 / Math.PI).toFixed(2)}π, θ₂=${(theta2 / Math.PI).toFixed(2)}π: E = ${energy.toFixed(4)}`);
  });

  console.log(`\nGround state energy: ${minEnergy.toFixed(4)}`);
  console.log(`Optimal parameters: [${(bestParams[0] / Math.PI).toFixed(2)}π, ${(bestParams[1] / Math.PI).toFixed(2)}π]`);

  console.log('\nQuantum chemistry applications:');
  console.log('  - Drug discovery');
  console.log('  - Catalyst design');
  console.log('  - Battery materials');
  console.log('  - Understanding chemical reactions');
}

// ============================================================================
// Example 6: Quantum Harmonic Oscillator
// ============================================================================

function example6_HarmonicOscillator(): void {
  console.log('\n=== Example 6: Quantum Harmonic Oscillator ===\n');

  console.log('Simulating quantum harmonic oscillator using qubits');
  console.log('(Truncated to lowest energy levels)\n');

  console.log('Energy eigenstates:');
  console.log('  |0⟩ ↔ ground state (n=0)');
  console.log('  |1⟩ ↔ first excited state (n=1)');

  const omega = 1.0; // Oscillator frequency

  console.log('\nCoherent state evolution:');
  console.log('  - Start in superposition (|0⟩ + |1⟩)/√2');
  console.log('  - Evolve under H = ω(n + 1/2)\n');

  const times = [0, 0.25, 0.5, 0.75, 1.0];

  times.forEach(t => {
    const sim = new QuantumSimulator(1);

    // Prepare coherent state (superposition)
    sim.executeOperation({ gate: 'H', targets: [0] });

    // Time evolution: different phases for |0⟩ and |1⟩
    // |0⟩ gets phase ωt/2, |1⟩ gets phase 3ωt/2
    // Net relative phase: ωt
    sim.executeOperation({ gate: 'Rz', targets: [0], params: [omega * t] });

    const probs = sim.getProbabilities();
    console.log(`  t = ${(t / Math.PI).toFixed(2)}π: State = ${sim.stateToString()}`);
  });

  console.log('\nPhysical systems modeled by harmonic oscillator:');
  console.log('  - Vibrating molecules');
  console.log('  - Photons in cavity');
  console.log('  - Phonons in crystals');
  console.log('  - Quantum fields');
}

// ============================================================================
// Example 7: Quantum Phase Transition
// ============================================================================

function example7_QuantumPhaseTransition(): void {
  console.log('\n=== Example 7: Quantum Phase Transition ===\n');

  console.log('Transverse field Ising model: H = -J·Z₁Z₂ - h·(X₁ + X₂)');
  console.log('Shows phase transition as h/J varies\n');

  console.log('Ground state for different field strengths:\n');

  const J = 1.0;
  const hValues = [0, 0.5, 1.0, 2.0, 5.0];

  hValues.forEach(h => {
    const sim = new QuantumSimulator(2);

    // Approximate ground state preparation
    if (h < J) {
      // Ferromagnetic phase: prefer |00⟩ or |11⟩
      sim.executeOperation({ gate: 'H', targets: [0] });
      sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
    } else {
      // Paramagnetic phase: prefer X eigenstates
      sim.executeOperation({ gate: 'H', targets: [0] });
      sim.executeOperation({ gate: 'H', targets: [1] });
    }

    const probs = sim.getProbabilities();
    const entanglement = probs[0] * probs[3] + probs[1] * probs[2];

    console.log(`  h/J = ${(h / J).toFixed(1)}: State = ${sim.stateToString()}`);
    console.log(`           Entanglement measure: ${entanglement.toFixed(3)}`);
  });

  console.log('\nPhase transition at h ≈ J:');
  console.log('  - h << J: Ferromagnetic (high entanglement)');
  console.log('  - h >> J: Paramagnetic (low entanglement)');
  console.log('  - Demonstrates quantum criticality');
}

// ============================================================================
// Example 8: Adiabatic State Preparation
// ============================================================================

function example8_AdiabaticStatePreparation(): void {
  console.log('\n=== Example 8: Adiabatic State Preparation ===\n');

  console.log('Prepare complex ground state by slowly changing Hamiltonian');
  console.log('H(s) = (1-s)H₀ + sH₁,  s: 0 → 1\n');

  console.log('Example: Prepare Bell state adiabatically');
  console.log('  H₀ = X₁ (easy ground state: |+⟩)');
  console.log('  H₁ = -Z₁Z₂ (target ground state: Bell state)\n');

  const steps = 5;
  console.log(`Adiabatic evolution with ${steps} steps:\n`);

  const sim = new QuantumSimulator(2);

  // Start in ground state of H₀
  sim.executeOperation({ gate: 'H', targets: [0] });

  for (let i = 0; i <= steps; i++) {
    const s = i / steps;

    // Apply small evolution step
    if (i > 0) {
      const dt = 0.1;

      // Mix of X and ZZ evolution
      const xWeight = 1 - s;
      const zzWeight = s;

      if (xWeight > 0) {
        sim.executeOperation({ gate: 'Rx', targets: [0], params: [2 * xWeight * dt] });
      }

      if (zzWeight > 0) {
        sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
        sim.executeOperation({ gate: 'Rz', targets: [1], params: [-2 * zzWeight * dt] });
        sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
      }
    }

    console.log(`  s = ${s.toFixed(2)}: ${sim.stateToString()}`);
  }

  console.log('\nAdiabatic quantum computation:');
  console.log('  - Based on adiabatic theorem');
  console.log('  - Alternative to gate-based quantum computing');
  console.log('  - Used in quantum annealing (D-Wave)');
  console.log('  - Natural for optimization problems');
}

// ============================================================================
// Example 9: Many-Body Localization
// ============================================================================

function example9_ManyBodyLocalization(): void {
  console.log('\n=== Example 9: Many-Body Localization ===\n');

  console.log('Disorder can prevent thermalization in quantum systems\n');

  console.log('Comparing clean vs disordered spin chain:');

  const numSpins = 3;

  // Clean system
  console.log('\n1. Clean system (no disorder):');
  const cleanSim = new QuantumSimulator(numSpins);
  cleanSim.executeOperation({ gate: 'X', targets: [0] }); // Localized excitation

  // Apply uniform interactions
  for (let i = 0; i < numSpins - 1; i++) {
    cleanSim.executeOperation({ gate: 'CNOT', targets: [i + 1], controls: [i] });
  }

  console.log('   Initial: |100⟩');
  console.log('   After evolution:', cleanSim.stateToString());
  console.log('   → Excitation spreads (thermalization)');

  // Disordered system (simulated by different gate strengths)
  console.log('\n2. Disordered system:');
  const disorderedSim = new QuantumSimulator(numSpins);
  disorderedSim.executeOperation({ gate: 'X', targets: [0] });

  // Apply random-strength interactions (simulated)
  for (let i = 0; i < numSpins - 1; i++) {
    // Different strength for each bond (simplified disorder)
    const strength = i % 2 === 0 ? Math.PI / 4 : Math.PI / 8;
    disorderedSim.executeOperation({ gate: 'Ry', targets: [i], params: [strength] });
  }

  console.log('   Initial: |100⟩');
  console.log('   After evolution:', disorderedSim.stateToString());
  console.log('   → Excitation remains more localized');

  console.log('\nMany-body localization:');
  console.log('  - Eigenstate thermalization fails');
  console.log('  - System "remembers" initial conditions');
  console.log('  - Active research area in condensed matter');
  console.log('  - Relevant for quantum memory');
}

// ============================================================================
// Example 10: Quantum Thermalization
// ============================================================================

function example10_QuantumThermalization(): void {
  console.log('\n=== Example 10: Quantum Thermalization ===\n');

  console.log('Isolated quantum system evolving to thermal equilibrium\n');

  console.log('Simple model: Energy exchange between two qubits');

  const numSteps = 5;

  console.log('\nTime evolution of initially excited state |10⟩:\n');

  const sim = new QuantumSimulator(2);
  sim.executeOperation({ gate: 'X', targets: [0] }); // Initial: |10⟩

  console.log(`  t = 0: ${sim.stateToString()}`);

  for (let step = 1; step <= numSteps; step++) {
    // SWAP-like interaction (energy exchange)
    sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
    sim.executeOperation({ gate: 'H', targets: [0] });
    sim.executeOperation({ gate: 'CNOT', targets: [0], controls: [1] });
    sim.executeOperation({ gate: 'H', targets: [0] });

    const probs = sim.getProbabilities();
    console.log(`  t = ${step}: ${sim.stateToString()}`);

    if (step === numSteps) {
      console.log('\n  Final probabilities:');
      ['00', '01', '10', '11'].forEach((state, i) => {
        console.log(`    |${state}⟩: ${(probs[i] * 100).toFixed(1)}%`);
      });
    }
  }

  console.log('\nThermalization in quantum systems:');
  console.log('  - Eigenstate thermalization hypothesis (ETH)');
  console.log('  - Local observables reach thermal equilibrium');
  console.log('  - Connects quantum mechanics and statistical physics');
}

// ============================================================================
// Run All Examples
// ============================================================================

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        Quantum Computing: Quantum Simulation              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  example1_SingleSpinDynamics();
  example2_TwoSpinInteraction();
  example3_SpinChainDynamics();
  example4_TrotterDecomposition();
  example5_HydrogenMolecule();
  example6_HarmonicOscillator();
  example7_QuantumPhaseTransition();
  example8_AdiabaticStatePreparation();
  example9_ManyBodyLocalization();
  example10_QuantumThermalization();

  console.log('\n' + '='.repeat(60));
  console.log('All quantum simulation examples completed!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_SingleSpinDynamics,
  example2_TwoSpinInteraction,
  example3_SpinChainDynamics,
  example4_TrotterDecomposition,
  example5_HydrogenMolecule,
  example6_HarmonicOscillator,
  example7_QuantumPhaseTransition,
  example8_AdiabaticStatePreparation,
  example9_ManyBodyLocalization,
  example10_QuantumThermalization,
};
