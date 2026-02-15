const state = {
  players: [],
  round: 0,
  colorSwitch: 0,
  activePairings: [],
  history: [],
  started: false,
};

const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playersList = document.getElementById('players-list');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const roundBadge = document.getElementById('round-badge');
const roundMeta = document.getElementById('round-meta');
const pairingsNode = document.getElementById('pairings');
const completeRoundBtn = document.getElementById('complete-round-btn');
const nextRoundBtn = document.getElementById('next-round-btn');
const standingsNode = document.getElementById('standings');

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function addPlayer(name) {
  if (state.started) {
    alert('Cannot add players after the tournament has started.');
    return;
  }

  const normalized = name.trim();
  if (!normalized) return;

  const duplicate = state.players.some(
    (p) => p.name.toLowerCase() === normalized.toLowerCase(),
  );
  if (duplicate) {
    alert('Player name already exists.');
    return;
  }

  state.players.push({
    id: uid(),
    name: normalized,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    byes: 0,
    whites: 0,
    blacks: 0,
  });

  render();
}

function removePlayer(playerId) {
  if (state.started) {
    alert('Cannot remove players after the tournament has started.');
    return;
  }

  state.players = state.players.filter((p) => p.id !== playerId);
  render();
}

function resetTournament() {
  if (!confirm('Reset all players, rounds, and results?')) return;
  state.players = [];
  state.round = 0;
  state.colorSwitch = 0;
  state.activePairings = [];
  state.history = [];
  state.started = false;
  render();
}

function createRoundPairings() {
  const shuffled = shuffle(state.players);
  const pairings = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];

    if (!b) {
      pairings.push({ type: 'bye', playerId: a.id });
      continue;
    }

    const flip = state.colorSwitch % 2 === 1;
    const whiteId = flip ? b.id : a.id;
    const blackId = flip ? a.id : b.id;

    pairings.push({
      type: 'board',
      board: pairings.filter((p) => p.type === 'board').length + 1,
      whiteId,
      blackId,
      result: '',
    });
  }

  return pairings;
}

function startTournament() {
  if (state.players.length < 2) {
    alert('Add at least 2 players to start.');
    return;
  }

  state.started = true;
  state.round = 1;
  state.colorSwitch = 1;
  state.activePairings = createRoundPairings();
  render();
}

function applyResult(board, result) {
  const white = state.players.find((p) => p.id === board.whiteId);
  const black = state.players.find((p) => p.id === board.blackId);

  if (!white || !black) return;

  if (result === '1-0') {
    white.points += 1;
    white.wins += 1;
    black.losses += 1;
  } else if (result === '0-1') {
    black.points += 1;
    black.wins += 1;
    white.losses += 1;
  } else if (result === '1/2-1/2') {
    white.points += 0.5;
    black.points += 0.5;
    white.draws += 1;
    black.draws += 1;
  }

  white.whites += 1;
  black.blacks += 1;
}

function completeRound() {
  if (!state.started) return;

  const boards = state.activePairings.filter((p) => p.type === 'board');
  const unfinished = boards.some((b) => !b.result);
  if (unfinished) {
    alert('Set all board results before completing the round.');
    return;
  }

  state.activePairings.forEach((pairing) => {
    if (pairing.type === 'bye') {
      const player = state.players.find((p) => p.id === pairing.playerId);
      if (player) {
        player.points += 1;
        player.byes += 1;
      }
      return;
    }
    applyResult(pairing, pairing.result);
  });

  state.history.push({
    round: state.round,
    colorSwitch: state.colorSwitch,
    pairings: JSON.parse(JSON.stringify(state.activePairings)),
  });

  state.activePairings = [];
  completeRoundBtn.disabled = true;
  nextRoundBtn.disabled = false;
  render();
}

function nextRound() {
  if (!state.started) return;

  state.round += 1;
  state.colorSwitch += 1;
  state.activePairings = createRoundPairings();
  render();
}

function getPlayer(id) {
  return state.players.find((p) => p.id === id);
}

function sortedStandings() {
  return [...state.players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });
}

function renderPlayers() {
  if (state.players.length === 0) {
    playersList.innerHTML = '<li>No players yet.</li>';
    return;
  }

  playersList.innerHTML = state.players
    .map(
      (p) => `
      <li>
        <div class="player-line">
          <span>${p.name}</span>
          <button type="button" class="remove-btn" data-player-id="${p.id}">Remove</button>
        </div>
      </li>
    `,
    )
    .join('');
}

function renderPairings() {
  if (!state.started) {
    pairingsNode.innerHTML = '';
    roundMeta.textContent = 'Tournament not started.';
    return;
  }

  roundMeta.textContent = `Color switch state: ${state.colorSwitch} (${state.colorSwitch % 2 === 1 ? 'First player = White' : 'First player = Black'})`;

  if (state.activePairings.length === 0) {
    pairingsNode.innerHTML = '<div class="bye">Round completed. Generate the next round.</div>';
    return;
  }

  pairingsNode.innerHTML = state.activePairings
    .map((pairing, idx) => {
      if (pairing.type === 'bye') {
        const player = getPlayer(pairing.playerId);
        return `<div class="bye">Bye: <strong>${player?.name ?? 'Unknown'}</strong> (earns 1 point on round completion)</div>`;
      }

      const white = getPlayer(pairing.whiteId);
      const black = getPlayer(pairing.blackId);
      return `
      <div class="board">
        <div class="board-title">Board ${pairing.board}</div>
        <div class="vs">⚪ ${white?.name ?? 'Unknown'} vs ⚫ ${black?.name ?? 'Unknown'}</div>
        <label>
          Result
          <select data-pairing-index="${idx}">
            <option value="" ${!pairing.result ? 'selected' : ''}>Select</option>
            <option value="1-0" ${pairing.result === '1-0' ? 'selected' : ''}>1-0 (White wins)</option>
            <option value="0-1" ${pairing.result === '0-1' ? 'selected' : ''}>0-1 (Black wins)</option>
            <option value="1/2-1/2" ${pairing.result === '1/2-1/2' ? 'selected' : ''}>½-½ (Draw)</option>
          </select>
        </label>
      </div>
      `;
    })
    .join('');
}

function renderStandings() {
  if (state.players.length === 0) {
    standingsNode.innerHTML = '<p>No standings yet.</p>';
    return;
  }

  const rows = sortedStandings()
    .map(
      (p, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${p.name}</td>
        <td>${p.points.toFixed(1)}</td>
        <td>${p.wins}</td>
        <td>${p.draws}</td>
        <td>${p.losses}</td>
        <td>${p.whites}</td>
        <td>${p.blacks}</td>
        <td>${p.byes}</td>
      </tr>
    `,
    )
    .join('');

  standingsNode.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Pts</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>White</th>
          <th>Black</th>
          <th>Byes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function render() {
  roundBadge.textContent = `Round ${state.round}`;

  const canStart = !state.started && state.players.length >= 2;
  startBtn.disabled = !canStart;

  const hasActiveBoards =
    state.started && state.activePairings.some((p) => p.type === 'board');
  completeRoundBtn.disabled = !hasActiveBoards;

  const canMakeNextRound = state.started && state.activePairings.length === 0;
  nextRoundBtn.disabled = !canMakeNextRound;

  renderPlayers();
  renderPairings();
  renderStandings();
}

playerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addPlayer(playerNameInput.value);
  playerNameInput.value = '';
  playerNameInput.focus();
});

playersList.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const playerId = target.dataset.playerId;
  if (!playerId) return;
  removePlayer(playerId);
});

pairingsNode.addEventListener('change', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLSelectElement)) return;
  const idx = Number(target.dataset.pairingIndex);
  if (Number.isNaN(idx)) return;

  const pairing = state.activePairings[idx];
  if (!pairing || pairing.type !== 'board') return;
  pairing.result = target.value;
});

startBtn.addEventListener('click', startTournament);
completeRoundBtn.addEventListener('click', completeRound);
nextRoundBtn.addEventListener('click', nextRound);
resetBtn.addEventListener('click', resetTournament);

render();
