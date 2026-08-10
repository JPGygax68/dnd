const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDatasheetMarkdown, renderMonsterDatasheet } = require('./generate-datasheets');

test('buildDatasheetMarkdown produces a concise DM-facing statblock', () => {
  const monster = {
    id: 'creature-test',
    name: 'Test Creature',
    armorClass: 12,
    hitPoints: 9,
    speed: '30 ft.',
    stats: { str: 10, dex: 12, con: 11, int: 8, wis: 9, cha: 7 },
    actions: [
      { name: 'Strike', desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.' },
    ],
    family: 'Test Family',
    cr: '1/4',
    xp: 50,
    tier: 'Minion',
  };

  const markdown = buildDatasheetMarkdown(monster);

  assert.match(markdown, /### Test Creature/);
  assert.match(markdown, /\*AC\*/);
  assert.match(markdown, /\*HP\*/);
  assert.match(markdown, /\*Speed\*/);
  assert.match(markdown, /\*STR\*/);
  assert.match(markdown, /10 \(\+0\)/);
  assert.match(markdown, /#### Strike/);
  assert.match(markdown, /Melee Weapon Attack/);
});

test('renderMonsterDatasheet uses a generic template when no creature-specific template exists', () => {
  const templatePath = path.join(__dirname, '../templates/creature-default.pug');
  const previousContent = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf8') : null;

  fs.writeFileSync(templatePath, '| ### #{name}\n| #{actions.length}', 'utf8');

  try {
    const monster = {
      id: 'creature-test',
      name: 'Generic Template Creature',
      family: 'Test Family',
      cr: '1/4',
      tier: 'Minion',
      armorClass: 12,
      hitPoints: 9,
      speed: '30 ft.',
      stats: { str: 10, dex: 12, con: 11, int: 8, wis: 9, cha: 7 },
      actions: [{ name: 'Strike', desc: 'A strike.' }],
      xp: 50,
    };

    const rendered = renderMonsterDatasheet(monster);
    assert.match(rendered, /### Generic Template Creature/);
    assert.match(rendered, /1/);
  } finally {
    if (previousContent === null) {
      fs.unlinkSync(templatePath);
    } else {
      fs.writeFileSync(templatePath, previousContent, 'utf8');
    }
  }
});
