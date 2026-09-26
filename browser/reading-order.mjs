const rankedCodes = 'ABCDEF';
const unrankedLabels = {X: 'Frequency unspecified', I: 'Inscription evidence', M: 'Graffiti evidence', N: 'Chiefly Pliny'};

function withFrequency(item, token) {
  if (item.kind !== 'entry') return item;
  const parse = token.parses[item.sourceIndices[0]];
  const code = parse?.entry.flags[3] ?? 'X';
  const rank = rankedCodes.indexOf(code);
  const label = rank >= 0
    ? item.details.find(detail => detail.label === 'Dictionary frequency')?.value
    : unrankedLabels[code];
  return {...item, frequency: {code, rank: rank < 0 ? null : rank, label: label ?? 'Frequency unspecified'}};
}

// Explanation rows delimit source interpretation groups. Never sort across one.
function orderEntries(items) {
  const output = [], run = [];
  function flush() {
    run.sort((a, b) => (a.frequency.rank ?? rankedCodes.length) - (b.frequency.rank ?? rankedCodes.length));
    output.push(...run); run.length = 0;
  }
  for (const item of items) {
    if (item.kind === 'entry') run.push(item);
    else { flush(); output.push(item); }
  }
  flush(); return output;
}

export function orderReading(view, analysis, order = 'frequency') {
  if (!['frequency', 'original'].includes(order)) throw new Error('Unknown reading order');
  if (order === 'original' || view.language !== 'latin') return view;
  return {...view, tokens: view.tokens.map((token, index) => ({...token,
    items: orderEntries(token.items.map(item => withFrequency(item, analysis.tokens[index])))
  }))};
}
