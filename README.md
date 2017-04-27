# 读读 server端
> 读读 客户端的后台服务器, 读读 客户端: https://github.com/monzy613/dudu-client
> nodejs+express+mongodb

## Requirements
1. mongodb
2. node

## Deployment
```shell
touch ./server/config.json
```
#### config.json 内容如下, appkey等请自己申请, 三方服务有：阿里大于, 七牛云储存
```json
{
  "mongoCfg": {
    "uri": ""
  },
  "alidayuCfg": {
    "appkey": "",
    "appsecret": "",
    "sms_free_sign_name": "",
    "sms_template_code": ""
  },
  "qiniuCfg": {
    "accessKey": "",
    "secretKey": "",
    "bucket": "",
    "host": ""
  },
  "sessionSecret": ""
}
```
```shell
npm install
npm start # equal to npm run debug, and make sure u have started ur mongodb first
npm run debug
npm run release
```

## Api (待完善)
```
http://docs.dudu5.apiary.io/
```