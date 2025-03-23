import { Context, Schema, segment, h } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-console'

export const name = 'xiaohongshu'

export const usage = `
## 解析群聊中的小红书图片/视频链接

API源码参考(自行部署): https://alist.mu-jie.cc/Public/Other

API作者: [@MuJie](https://mu-jie.cc/)

### 使用方法

请在app中复制链接, 然后发送到群聊中即可解析，不支持如下链接:

<pre>
19 【键盘染色：Keycult No.2/65 & Felice 40 - Sachiopro | 小红书 - 你的生活指南】 😆 52QxCQmrMDL3Yja 😆 
https://www.xiaohongshu.com/discovery/item/67d9205b000000001d01442b
?source=webshare&xhsshare=pc_web&xsec_token=ABjjxJm5QFO30KoDLhXyBI2Q165Cc6WjaC5gNt1vBibl4=&xsec_source=pc_share
</pre>
`;


export interface Config {
  apiHost: string
}

export const Config = Schema.object({
  apiHost: Schema.string().default('https://api.mu-jie.cc/xhs').description('填写你的API前缀, 以/xhs结尾'),
})

export function apply(ctx: Context, config: Config) {

  async function fetchFromAPI(url) {
    return await ctx.http.get(config.apiHost + '?url=' + url);
  };

  ctx.middleware(async (session, next) => {
    if (!session.content.includes('xhslink.com')) return next()
    const urlRegex = /https?:\/\/[^\s，]+/;
    const url = session.content.match(urlRegex);
    if (!url) return

    try {
      const result = await fetchFromAPI(url);
      if (result.code !== 200) {
        return '解析失败!';
      }
      const type = result.data.type
      const title = result.data.title;
      const images = result.data.images || [];
      await session.send(title.replace(/[|&;$%@"<>()+,]/g, ""));

      if (type === "视频") {
        session.send(h.video(result.data.url))
      } else {
        if (images.length > 3) {
          // 图片过多合并转发
          const forwardMessages = await Promise.all(images.map(async (img) => {
            return h('img', { src: img })
          }));
          const forwardMessage = h('message', { forward: true, children: forwardMessages });
          await session.send(forwardMessage);
        } else {
          images.forEach(async item => {
            session.send(h('img', { src: item }))
          });
        }
      }

    } catch(err) {
      console.log(err);
      return `发生错误!;  ${err}`;
    }
  });

  ctx.inject(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })
}
