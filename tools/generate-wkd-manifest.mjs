import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const ZBASE32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769';

/**
 * 将二进制数据编码为 z-base-32 字符串
 * @param data Uint8Array 原始二进制数据
 */
function encodeZBase32(data) {
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of data) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      const index = (buffer >>> (bitsLeft - 5)) & 0x1f;
      result += ZBASE32_ALPHABET[index];
      bitsLeft -= 5;
    }
  }

  return result;
}

/**
 * 计算邮箱地址的 WKD Hash
 * @param userIdFromEmail 完整的邮箱地址 (例如: User@Example.com)
 * @returns 32位的 WKD Hash 字符串
 */
async function getWKDHash(localPart) {
  const encoder = new TextEncoder();
  const data = encoder.encode(localPart.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = new Uint8Array(hashBuffer);
  return encodeZBase32(hashArray);
}


const keysDir = './keys';
const manifest = {};

let keyCount = 0;
const domains = readdirSync(keysDir);
for (const domain of domains) {
  const users = readdirSync(join(keysDir, domain));
  for (const fileName of users) {
    const [username, extName] = fileName.split(".", 2);
    if (extName && extName.toLowerCase() !== "gpg") {
        console.error(`[WARN] The key must be GPG binary format, Skip... (fileName: ${domain}/${fileName})`);
        continue;
    }
    const hash = await getWKDHash(username);
    manifest[`${domain}/${hash}`] = `${domain}/${fileName}`;
    keyCount ++;
  }
}

if (keyCount > 0) {
  writeFileSync('./src/key-manifest.json', JSON.stringify(manifest, null, 2));
  console.info(`✅ Success: Generated Key manifest with ${keyCount} keys.`);
} else {
  console.error("❌ Error: No eligible keys found in the ./keys directory.");
  console.error("Please ensure your keys are in './keys/{domain}/{username}.gpg' format.");
  process.exit(1);
}