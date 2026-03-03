const fs = require('fs');
const path = require('path');

const KEEP_LOCALES = new Set(['en-US.pak', 'ko.pak']);

exports.default = async function (context) {
  const localesDir = path.join(context.appOutDir, 'locales');
  if (!fs.existsSync(localesDir)) return;

  for (const file of fs.readdirSync(localesDir)) {
    if (!KEEP_LOCALES.has(file)) {
      fs.unlinkSync(path.join(localesDir, file));
    }
  }

  console.log(`[afterPack] Pruned locales → kept: ${[...KEEP_LOCALES].join(', ')}`);
};
