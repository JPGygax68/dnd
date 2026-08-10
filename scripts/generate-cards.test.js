const test = require('node:test');
const assert = require('node:assert/strict');
const { renderTemplate, buildTemplateContext } = require('./generate-cards');

test('renderTemplate exposes monster properties at the root', () => {
  const monster = {
    id: 'creature-test',
    name: 'Test Creature',
    armorClass: 12,
    hitPoints: 9,
    speed: '30 ft.',
    stats: { str: 10, dex: 12, con: 11, int: 8, wis: 9, cha: 7 },
    actions: [{ name: 'Strike', desc: 'A simple strike.' }],
  };

  const context = buildTemplateContext(monster);
  const output = renderTemplate(
    '### {{name}}\nAC {{armorClass}}\nHP {{hitPoints}}\nSTR {{stats.str}}\n{{actionsMarkdown}}',
    context,
  );

  assert.match(output, /### Test Creature/);
  assert.match(output, /AC 12/);
  assert.match(output, /HP 9/);
  assert.match(output, /STR 10/);
  assert.match(output, /Strike/);
});
