const bs58 = require('bs58');
const fs = require('fs');

const base58key = "Cxq55oAZSEYfs3Ghi2VPhJ673wnyJ4t1poLKqsE1HgecjWS5UGDEhB7GtbuLmpDkvxxzpHNgHAGbwuHCos66eVo";
const secret = bs58.decode(base58key);
fs.writeFileSync('bridge-keypair.json', JSON.stringify(Array.from(secret)));
console.log("✅ Saved to bridge-keypair.json");
process.exit(0);
