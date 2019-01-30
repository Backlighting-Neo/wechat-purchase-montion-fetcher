const AnyProxy = require('anyproxy');
const fs = require('fs');
const imgcat = require('imgcat');
const crypto = require('crypto');
const { Wechaty } = require('wechaty');
const qrcode = require('qrcode-terminal');
const { FileBox } = require('file-box');
const imageminGifsicle = require('imagemin-gifsicle');

const montionHost = 'mmbiz.qpic.cn';

const rule = {
  summary: 'wechat purchase moniton fetcher',
  *beforeSendResponse(requestDetail, responseDetail) {
    const {requestOptions} = requestDetail;
    const {hostname, path} = requestOptions;
    const {response} = responseDetail;

    if(hostname === montionHost && response.header['Content-Type'] === 'image/gif') {
      const filename = `./temp/${crypto.createHash('md5').update(path).digest('hex')}.gif`;
      const buffer = response.body;
      imageminGifsicle()(buffer)
      fs.writeFileSync(filename, response.body);
      imgcat(filename).then(console.log).catch(console.error);
      bot.say(FileBox.fromFile(filename));
    }
  },
  *onError() {
    return null;
  },
}

const proxyServer = new AnyProxy.ProxyServer({
  port: 10888,
  rule
});

proxyServer.on('ready', () => {
  console.log('代理启动成功，监听在10888端口');
});
proxyServer.on('error', console.error);
// proxyServer.start();

const bot = new Wechaty();
bot.on('scan', url => {
  qrcode.generate(url, {small: true});
  console.log('使用微信扫描上面的二维码');
}).on('login', user => {
  console.log(`${user} 微信登录成功`);
}).start()
.then(() => { console.log('微信机器人启动'); })
.catch(console.error);