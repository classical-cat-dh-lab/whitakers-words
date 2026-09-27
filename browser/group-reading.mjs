const signature = value => JSON.stringify(value);
const formKey = ({terms, notes, form}) => signature([terms, notes, form]);
const sectionKey = item => signature([item.labels, item.details, item.frequency ?? null]);

function appendForms(target, forms) {
  for (const form of forms) {
    const existing = target.find(candidate => formKey(candidate) === formKey(form));
    const indices = form.sourceIndices ?? [form.sourceIndex];
    if (existing) existing.sourceIndices.push(...indices);
    else target.push({...form, sourceIndices: [...indices]});
  }
}

function sectionsFor(members) {
  const senses = new Map();
  for (const item of members) {
    const key = signature([sectionKey(item), item.meaning]);
    if (!senses.has(key)) senses.set(key, {labels: item.labels, details: item.details,
      frequency: item.frequency, forms: [], meanings: [item.meaning]});
    appendForms(senses.get(key).forms, item.forms);
  }
  const sections = new Map();
  for (const sense of senses.values()) {
    // Share a form list only when every displayed analysis and note agrees.
    const key = signature([sectionKey(sense), sense.forms.map(formKey)]);
    if (sections.has(key)) {
      const section = sections.get(key);
      section.meanings.push(...sense.meanings);
      appendForms(section.forms, sense.forms);
    } else sections.set(key, sense);
  }
  return [...sections.values()];
}

// These are presentation groups, not claims of lexical identity. Equal principal
// parts may include homonyms: preserve their meanings, grammar and metadata.
// Original reading items remain attached for complete source accounting.
export function groupReading(view) {
  return {...view, tokens: view.tokens.map(token => {
    const items = [], groups = new Map();
    for (const item of token.items) {
      if (item.kind !== 'entry') {
        items.push(item); groups.clear(); // Never cross an interpretation note.
        continue;
      }
      let group = groups.get(item.title);
      if (!group) {
        group = {kind: 'entry', title: item.title, members: []};
        groups.set(item.title, group); items.push(group);
      }
      group.members.push(item);
    }
    return {...token, items: items.map(item => item.kind === 'entry'
      ? {...item, sections: sectionsFor(item.members)} : item)};
  })};
}
