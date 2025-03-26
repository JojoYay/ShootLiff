const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 環境変数に応じて設定ファイルを読み込む関数
function loadEnvConfig() {
  const env = process.argv[2] || 'test';
  const configDir = path.resolve('./config');
  let configFileName = `config.${env}.json`;
  const configFilePath = path.join(configDir, configFileName);

  try {
    const configFile = fs.readFileSync(configFilePath, 'utf8');
    console.log(`設定ファイル ${configFileName}`);
    return JSON.parse(configFile);
  } catch (error) {
    console.warn(`設定ファイル ${configFileName} が見つかりませんでした。`);
    return {};
  }
}

function getFirebaseConfig() {
  const result = execSync('firebase functions:config:get', { encoding: 'utf-8' });
  return JSON.parse(result);
}

function setEnvFile(config) {
  const firebaseConfig = getFirebaseConfig();
  const envConfig = loadEnvConfig(); // 設定ファイルを読み込む

  let envContent = `NEXT_PUBLIC_LIFF_ID=${firebaseConfig.project_config.liff_id}\n`;
  envContent += `NEXT_PUBLIC_SERVER_URL=${firebaseConfig.project_config.server_url}\n`;
  envContent += `NEXT_PUBLIC_GA_ID=${firebaseConfig.project_config.ga_id}\n`;

  // envConfigの内容を.env.localに追加
  for (const key in envConfig) {
    if (envConfig.hasOwnProperty(key)) {
      envContent += `NEXT_PUBLIC_${toSnakeCase(key).toUpperCase()}="${envConfig[key]}"\n`;
    }
  }

  fs.writeFileSync('.env.local', envContent);
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
}

const config = getFirebaseConfig();
setEnvFile(config);