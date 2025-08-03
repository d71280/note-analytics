const fs = require('fs');
const path = require('path');

// PDF.jsワーカーファイルをpublicディレクトリにコピー
const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const destDir = path.join(__dirname, '../public/pdf.js');
const destFile = path.join(destDir, 'pdf.worker.min.js');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// ファイルをコピー
fs.copyFileSync(sourceFile, destFile);
console.log('PDF.js worker file copied to public/pdf.js/pdf.worker.min.js');