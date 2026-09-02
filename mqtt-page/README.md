# MQTT 手机页面（本地测试项目）

这是一个独立的手机端 MQTT 输入页面，用于本地快速调试，不需要部署到 Cloudflare。

## 启动

双击 `start.bat`，或在当前目录执行：

```bash
python server.py
```

启动后会显示本机访问地址和手机访问地址，例如：

```text
手机访问: http://192.168.31.125:8080
```

## 手机测试

1. 手机和电脑连接同一个 WiFi
2. 手机浏览器打开上面显示的地址，例如 `http://192.168.31.125:8080`
3. 在页面点“设置”，填写 MQTT 服务器、端口、用户名、密码和共享密钥
4. 保存并连接后即可输入/语音发送

## 文件结构

```text
index.html            页面结构
static/mqtt.css       样式
static/mqtt.js        页面逻辑
（MQTT.js 和 forge 从免费 CDN 加载，不放在项目里）
```

## 修改页面

直接修改 `index.html`、`static/mqtt.css`、`static/mqtt.js`，保存后手机刷新页面即可看到效果，不需要重新部署。

第三方库（MQTT.js、forge）通过 jsdelivr CDN 加载，无法访问 CDN 时会自动尝试 unpkg。

修改确认后，再把同样改动同步到 `qaa-airtype/theme/mqtt.html` 和 `cfchat` 项目中。
