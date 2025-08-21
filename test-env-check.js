// 環境変数のチェック

console.log('環境変数チェック:');
console.log('=================');
console.log('X_API_KEY:', process.env.X_API_KEY ? '✅ 設定済み' : '❌ 未設定');
console.log('X_API_SECRET:', process.env.X_API_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('X_API_KEY_SECRET:', process.env.X_API_KEY_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('X_ACCESS_TOKEN:', process.env.X_ACCESS_TOKEN ? '✅ 設定済み' : '❌ 未設定');
console.log('X_ACCESS_TOKEN_SECRET:', process.env.X_ACCESS_TOKEN_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('X_BEARER_TOKEN:', process.env.X_BEARER_TOKEN ? '✅ 設定済み' : '❌ 未設定');

// dotenvで.env.localを読み込む
require('dotenv').config({ path: '.env.local' });

console.log('\n.env.local読み込み後:');
console.log('=====================');
console.log('X_API_KEY:', process.env.X_API_KEY ? '✅ 設定済み' : '❌ 未設定');
console.log('X_API_SECRET:', process.env.X_API_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('X_API_KEY_SECRET:', process.env.X_API_KEY_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('X_ACCESS_TOKEN:', process.env.X_ACCESS_TOKEN ? '✅ 設定済み' : '❌ 未設定');
console.log('X_ACCESS_TOKEN_SECRET:', process.env.X_ACCESS_TOKEN_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('X_BEARER_TOKEN:', process.env.X_BEARER_TOKEN ? '✅ 設定済み' : '❌ 未設定');