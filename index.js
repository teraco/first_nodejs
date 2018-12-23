require('dotenv').config();

const puppeteer = require('puppeteer');
const USER_ID = process.env.MY_USER_ID;
const PASSWORD = process.env.MY_PASSWORD;
const SENDGRID_API_KEY = process.env.MY_APIKEY;
const EMAIL = process.env.MY_EMAIL;

const CosmosClient = require('@azure/cosmos').CosmosClient;

const url = require('url');

const endpoint = process.env.NODEJS_endpoint;
const masterKey = process.env.NODEJS_primaryKey;

const client = new CosmosClient({ endpoint: endpoint, auth: { masterKey: masterKey } });

const HttpStatusCodes = { NOTFOUND: 404 };

const databaseId = process.env.NODEJS_database_id;
const containerId = process.env.NODEJS_container_id;

// 日付計算
const now = new Date();
const datetime = (now.getFullYear() + "-"  + (now.getMonth() + 1) + "-" + now.getDate() + "-" + now.getHours() + "-" + now.getMinutes());
const lastdate = new Date(now.getFullYear(), (now.getMonth() + 1) ,0)
const remaindate = (lastdate.getDate() - now.getDate() + 1)

// using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(SENDGRID_API_KEY);

// メインロジック

(async () => {
  // Puppeteerの起動
  const browser = await puppeteer.launch({
    headless: true, //HeadLessモードでの起動有無
    slowMo: 50, // 指定のミリ秒スローモーションで実行する
  });

  // 新しい空のページを開く
  const page = await browser.newPage();

  // view portの設定
  await page.setViewport({
    width: 1200,
    height: 800,
  })

  // 開く先のWebサイトへ遷移
  await page.goto('https://www.iijmio.jp/service/setup/hdd/couponstatus/')

  // 特定のid属性を待機
  await page.waitForSelector('.content_href > .colm2 > .login_member > form > .input_Gry.fzL.mgbM');

  // // ID入力
  await page.type('input[name=j_username]', USER_ID)

  // Password入力
  await page.type('input[name=j_password]', PASSWORD)

  // submit
  await page.waitForSelector('.colm2 > .login_member > form > .send_Btn > #x-submit')
  await page.click('.colm2 > .login_member > form > .send_Btn > #x-submit')

  // 要素取得
  await page.waitForSelector('.data2')
  const datavolumestr = await page.evaluate((selector) => {
    return document.querySelector(selector).innerText;
  }, '.data2')

  console.log(datavolumestr);
  
  // ブラウザの終了.
  await browser.close();

  // 容量計算処理
  const datavolume = (datavolumestr.slice(0, datavolumestr.length - 2))
  const remaindatavolume = datavolume - 12000
  const remaindatavolumeperday = (remaindatavolume / remaindate)
  console.log(remaindatavolume)
  console.log(remaindatavolumeperday)

  // DB用JSON作成
  const itembodyjson = {
    "myitem": {
        "id": `${datetime}`,
        "remaindatavolume": `${remaindatavolume}`,
        "remaindatavolumeperday": `${remaindatavolumeperday}`
  }
};

  // メール送信
  const msg = {
    to: EMAIL,
    from: EMAIL,
    subject: `[IIJ_datavolume]: ${datetime} / ${remaindatavolume}MB`,
    html: `[IIJ_datavolume]<br>${datetime}<br>${remaindatavolume}MB<br>${remaindatavolumeperday}MB`,
  };
  sgMail.send(msg);

  // Create data if it does not exist
  async function createFamilyItem(itemBody) {
    try {
        // read the item to see if it exists
        const { item } = await client.database(databaseId).container(containerId).item(itemBody.id).read();
        console.log(`Item with family id ${itemBody.id} already exists\n`);
    }
    catch (error) {
      // create the data if it does not exist
      if (error.code === HttpStatusCodes.NOTFOUND) {
          const { item } = await client.database(databaseId).container(containerId).items.create(itemBody);
          console.log(`Created data with id:\n${itemBody.id}\n`);
      } else {
          throw error;
      }
    }
  };

  // Exit the app with a prompt
  // @param {message} message - The message to display
  function exit(message) {
  console.log(message);
  // console.log('Press any key to exit');
  // process.stdin.setRawMode(true);
  // process.stdin.resume();
  // process.stdin.on('data', process.exit.bind(process, 0));
  }

  createFamilyItem(itembodyjson.myitem)
    .then(() => { exit(`Completed successfully`); })
    .catch((error) => { exit(`Completed with error ${JSON.stringify(error)}`) });

})(); // 最後の()は定義した関数の即時実行
