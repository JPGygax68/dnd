const { generateDatasheets } = require('./generate-datasheets');

if (require.main === module) {
  generateDatasheets();
}

module.exports = {
  generateDatasheets,
};
