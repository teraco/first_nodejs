const fs = require('fs');

// 日付計算
const now = new Date();
const datetime = (now.getFullYear() + "-"  + (now.getMonth() + 1) + "-" + now.getDate() + "-" + now.getHours() + "-" + now.getMinutes());
const lastdate = new Date(now.getFullYear(), (now.getMonth() + 1) ,0)
const remaindate = (lastdate.getDate() - now.getDate() + 1)

// メインロジック
// 容量計算処理
const datavolume = 12345
const remaindatavolume = datavolume - 12000
const remaindatavolumeperday = (remaindatavolume / remaindate)
console.log(remaindatavolume)
console.log(remaindatavolumeperday)

// フォルダ作成
fs.mkdir('log', function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  else {
    console.log('finished!!');
  }
});

// ファイル作成
fs.mkdir('logs', function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  else {
    console.log('finished!!');
  }
});

fs.writeFileSync(`log/${datetime}.log`, `${datetime}`);