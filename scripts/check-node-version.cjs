const requiredMajor = 18;
const current = process.versions.node;
const major = Number(current.split('.')[0]);

if (Number.isNaN(major) || major < requiredMajor) {
  console.error(`\n[tradingnarwhal] Node.js ${requiredMajor}+ is required. Current: v${current}.`);
  console.error("Please run: nvm install 20 && nvm use 20\n");
  process.exit(1);
}
