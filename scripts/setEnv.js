const { execSync } = require('child_process');
const fs = require('fs');

function getFirebaseConfig() {
  const result = execSync('firebase functions:config:get', { encoding: 'utf-8' });
  return JSON.parse(result);
}

function setEnvFile(config) {
  const envContent = `
NEXT_PUBLIC_LIFF_ID=${config.project_config.liff_id}
NEXT_PUBLIC_SERVER_URL=${config.project_config.server_url}
  `;
  fs.writeFileSync('.env.local', envContent);
}

const config = getFirebaseConfig();
setEnvFile(config);