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
  const env = process.argv[2] || 'test';
  const result = execSync(`firebase functions:config:get --project ${env}`, { encoding: 'utf-8' });
  return JSON.parse(result);
}

function setEnvFile(config) {
  const firebaseConfig = getFirebaseConfig();
  const envConfig = loadEnvConfig(); // 設定ファイルを読み込む

  // デプロイ時の日時情報を取得
  const now = new Date();
  const deployDate = now.toISOString();
  const deployVersion = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  // Default Firebase config. Context root URLs: any key server_url_<name> (except server_url) -> NEXT_PUBLIC_CONTEXT_ROOT_URLS JSON
  const proj = firebaseConfig.project_config || {};
  const contextRootUrls = {};
  for (const key of Object.keys(proj)) {
    if (key.startsWith('server_url_') && key !== 'server_url') {
      const name = key.replace(/^server_url_/, '').toLowerCase();
      if (proj[key]) contextRootUrls[name] = proj[key];
    }
  }
  let envContent = `NEXT_PUBLIC_LIFF_ID=${proj.liff_id}\n`;
  envContent += `NEXT_PUBLIC_SERVER_URL=${proj.server_url || ''}\n`;
  if (Object.keys(contextRootUrls).length > 0) {
    const json = JSON.stringify(contextRootUrls);
    envContent += `NEXT_PUBLIC_CONTEXT_ROOT_URLS='${json}'\n`;
  }
  envContent += `NEXT_PUBLIC_GA_ID=${proj.ga_id}\n`;
  envContent += `NEXT_PUBLIC_DEPLOY_DATE="${deployDate}"\n`;
  envContent += `NEXT_PUBLIC_DEPLOY_VERSION="${deployVersion}"\n`;

  // envConfigの内容を.env.localに追加（FirebaseConfigの内容を上書き）
  for (const key in envConfig) {
    if (envConfig.hasOwnProperty(key)) {
      const envKey = `NEXT_PUBLIC_${toSnakeCase(key).toUpperCase()}`;
      envContent = envContent.replace(new RegExp(`${envKey}=.*\n`), ''); // 既存の設定を削除
      let val = envConfig[key];
      if (key === 'contextRootUrls' && val && typeof val === 'object') {
        envContent += `${envKey}='${JSON.stringify(val)}'\n`; // 新しい設定を追加
      } else {
        const escaped = typeof val === 'string' ? val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : String(val);
        envContent += `${envKey}="${escaped}"\n`; // 新しい設定を追加
      }
    }
  }

  fs.writeFileSync('.env.local', envContent);
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
}

const config = getFirebaseConfig();
setEnvFile(config);