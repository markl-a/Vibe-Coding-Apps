/**
 * Quantum Simulator Examples
 */

import {
  QuantumSimulator,
  bellState,
  ghzState,
  deutschJozsa,
  quantumRNG,
  superdenseCoding,
} from './index.js';

function main() {
  console.log('='.repeat(60));
  console.log('Quantum Circuit Simulator Examples');
  console.log('='.repeat(60));

  // Example 1: Bell State
  console.log('\n📊 Example 1: Bell State');
  console.log('-'.repeat(40));

  const sim = new QuantumSimulator(2);
  const bellCircuit = bellState();
  const bellResult = sim.executeCircuit(bellCircuit);

  console.log('Circuit:', bellCircuit.name);
  console.log('Final state:', sim.stateToString());
  console.log('Probabilities:');
  bellResult.probabilities.forEach((p, i) => {
    if (p > 0.001) {
      const state = i.toString(2).padStart(2, '0');
      console.log(`  |${state}⟩: ${(p * 100).toFixed(1)}%`);
    }
  });

  // Run multiple shots
  const bellHistogram = sim.runShots(bellCircuit, 1000);
  console.log('Measurement outcomes (1000 shots):');
  for (const [outcome, count] of Object.entries(bellHistogram.outcomes)) {
    console.log(`  |${outcome}⟩: ${count} times (${((count / 1000) * 100).toFixed(1)}%)`);
  }

  // Example 2: GHZ State (3 qubits)
  console.log('\n📊 Example 2: GHZ State (3 qubits)');
  console.log('-'.repeat(40));

  const sim3 = new QuantumSimulator(3);
  const ghzCircuit = ghzState(3);
  sim3.executeCircuit(ghzCircuit);

  console.log('Circuit:', ghzCircuit.name);
  console.log('Final state:', sim3.stateToString());

  const ghzHistogram = sim3.runShots(ghzCircuit, 1000);
  console.log('Measurement outcomes:');
  for (const [outcome, count] of Object.entries(ghzHistogram.outcomes)) {
    console.log(`  |${outcome}⟩: ${count} times`);
  }

  // Example 3: Deutsch-Jozsa Algorithm
  console.log('\n📊 Example 3: Deutsch-Jozsa Algorithm');
  console.log('-'.repeat(40));

  // Balanced function
  const djBalanced = deutschJozsa(3, 'balanced');
  const simDJ = new QuantumSimulator(3);
  simDJ.executeCircuit(djBalanced);

  console.log('Circuit:', djBalanced.name);
  console.log('If all input qubits measure 0 → constant function');
  console.log('If any input qubit measures 1 → balanced function');

  const djHistogram = simDJ.runShots(djBalanced, 100);
  console.log('Results:');
  for (const [outcome, count] of Object.entries(djHistogram.outcomes)) {
    console.log(`  |${outcome}⟩: ${count}%`);
  }

  // Example 4: Quantum Random Number Generator
  console.log('\n📊 Example 4: Quantum Random Number Generator');
  console.log('-'.repeat(40));

  const rngCircuit = quantumRNG(4);
  const simRNG = new QuantumSimulator(4);

  console.log('Generating 10 random 4-bit numbers:');
  const randomNumbers: number[] = [];
  for (let i = 0; i < 10; i++) {
    simRNG.executeCircuit(rngCircuit);
    const measurements = simRNG.measureAll();
    const value = measurements.reduce(
      (acc, m, idx) => acc + (m.value << idx),
      0
    );
    randomNumbers.push(value);
  }
  console.log('Random numbers:', randomNumbers.join(', '));

  // Distribution test
  console.log('\nDistribution test (1000 samples):');
  const rngHistogram = simRNG.runShots(rngCircuit, 1000);
  const sortedOutcomes = Object.entries(rngHistogram.outcomes).sort(
    (a, b) => parseInt(b[0], 2) - parseInt(a[0], 2)
  );
  console.log(`Unique values: ${sortedOutcomes.length}/16`);

  // Example 5: Superdense Coding
  console.log('\n📊 Example 5: Superdense Coding');
  console.log('-'.repeat(40));

  const messages: Array<[0 | 1, 0 | 1]> = [[0, 0], [0, 1], [1, 0], [1, 1]];

  for (const msg of messages) {
    const sdCircuit = superdenseCoding(msg);
    const simSD = new QuantumSimulator(2);
    const histogram = simSD.runShots(sdCircuit, 100);

    const decoded = Object.keys(histogram.outcomes)[0];
    console.log(`Sent: ${msg.join('')} → Received: ${decoded}`);
  }

  // Example 6: Direct qubit manipulation
  console.log('\n📊 Example 6: Manual Qubit Operations');
  console.log('-'.repeat(40));

  const manualSim = new QuantumSimulator(1);
  console.log('Initial state:', manualSim.stateToString());

  // Apply X gate (NOT)
  manualSim.executeOperation({ gate: 'X', targets: [0] });
  console.log('After X gate:', manualSim.stateToString());

  // Reset and apply H gate
  manualSim.reset();
  manualSim.executeOperation({ gate: 'H', targets: [0] });
  console.log('After H gate:', manualSim.stateToString());

  // Apply T gate (π/8 rotation)
  manualSim.executeOperation({ gate: 'T', targets: [0] });
  console.log('After T gate:', manualSim.stateToString());

  console.log('\n' + '='.repeat(60));
  console.log('Simulation complete!');
}

main();
