const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const pug = require('pug');

const DATABASE_FILE = path.join(__dirname, '../bestiary/bestiary.yaml');
const OUTPUT_DIR = path.join(__dirname, '../printable-cards-input');
const TEMPLATE_DIR = path.join(__dirname, '../templates');

function formatModifier(value) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  const modifier = Math.floor((numericValue - 10) / 2);
  return `${numericValue} (${modifier >= 0 ? '+' : ''}${modifier})`;
}

function modifier(value) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  const modifier = Math.floor((numericValue - 10) / 2);
  return `${modifier >= 0 ? '+' : ''}${modifier}`;
}

function buildTemplateContext(monster) {
  const stats = monster.stats || {};

  return {
    ...monster,
    stats,
    modifier: (value) => modifier(value),
    statWithModifier: (value) => formatModifier(value),
  };
}

function renderMonsterDatasheet(monster) {
  const candidatePaths = [
    path.join(TEMPLATE_DIR, `${monster.id}.pug`),
    path.join(TEMPLATE_DIR, 'creature-default.pug'),
    path.join(TEMPLATE_DIR, 'default.pug'),
  ];

  const templatePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (templatePath) {
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const templateFn = pug.compile(templateSource, { filename: templatePath, pretty: true });
    return templateFn(buildTemplateContext(monster)).trim();
  }

  return buildDatasheetMarkdown(monster);
}

function buildDatasheetMarkdown(monster) {
  const stats = monster.stats || {};
  const actionsHtml = (monster.actions || [])
    .map((action) => `    <h4>${action.name}</h4>\n    <p>${action.desc}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
  <body>
    <h3>${monster.name}</h3>
    <p>${[monster.family, monster.cr, monster.tier].filter(Boolean).join(' • ')}</p>
    <table>
      <tr><th>AC</th><th>HP</th><th>Speed</th></tr>
      <tr><td>${monster.armorClass}</td><td>${monster.hitPoints}</td><td>${monster.speed}</td></tr>
    </table>
    <table>
      <tr><th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th></tr>
      <tr><td>${formatModifier(stats.str)}</td><td>${formatModifier(stats.dex)}</td><td>${formatModifier(stats.con)}</td><td>${formatModifier(stats.int)}</td><td>${formatModifier(stats.wis)}</td><td>${formatModifier(stats.cha)}</td></tr>
    </table>
    <p>CR: ${monster.cr} • XP: ${monster.xp ?? '-'}</p>
${actionsHtml}
  </body>
</html>`;
}

function generateDatasheets() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const fileContent = fs.readFileSync(DATABASE_FILE, 'utf8');
  const bestiary = YAML.parse(fileContent);

  bestiary.forEach((monster) => {
    const markdown = renderMonsterDatasheet(monster);
    const outputFilePath = path.join(OUTPUT_DIR, `${monster.id}.md`);
    fs.writeFileSync(outputFilePath, markdown, 'utf8');
  });

  console.log(`Generated ${bestiary.length} datasheets in ${OUTPUT_DIR}`);
}

if (require.main === module) {
  generateDatasheets();
}

module.exports = {
  buildDatasheetMarkdown,
  buildTemplateContext,
  renderMonsterDatasheet,
  generateDatasheets,
};
