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

function buildTemplateContext(monster) {
  const stats = monster.stats || {};

  return {
    ...monster,
    stats,
    modifier: (value) => formatModifier(value),
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
    const templateFn = pug.compile(templateSource, { filename: templatePath, pretty: false });
    return templateFn(buildTemplateContext(monster)).trim();
  }

  return buildDatasheetMarkdown(monster);
}

function buildDatasheetMarkdown(monster) {
  const stats = monster.stats || {};
  const actionsMarkdown = (monster.actions || [])
    .map((action) => `#### ${action.name}\n${action.desc}`)
    .join('\n\n');

  return `### ${monster.name}\n\n${[monster.family, monster.cr, monster.tier]
    .filter(Boolean)
    .join(' • ')}\n\n| *AC* | *HP* | *Speed* |\n| --- | --- | --- |\n| ${monster.armorClass} | ${monster.hitPoints} | ${monster.speed} |\n\n| *STR* | *DEX* | *CON* | *INT* | *WIS* | *CHA* |\n| --- | --- | --- | --- | --- | --- |\n| ${formatModifier(stats.str)} | ${formatModifier(stats.dex)} | ${formatModifier(stats.con)} | ${formatModifier(stats.int)} | ${formatModifier(stats.wis)} | ${formatModifier(stats.cha)} |\n\n${monster.cr ? `*CR:* ${monster.cr}  •  *XP:* ${monster.xp ?? '-'}\n\n` : ''}${actionsMarkdown}`.trim();
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
