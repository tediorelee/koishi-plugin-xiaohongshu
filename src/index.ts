import { Context, Schema, segment, h } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-console'

export const name = 'xiaohongshu'

export interface Config {
  apiHost: string
}

export const Config = Schema.object({
  apiHost: Schema.string().default('https://api.mu-jie.cc/xhs').description('填写你的API前缀'),
  description: Schema.string().default('API参考: https://api.mu-jie.cc/').description(''),
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

      if (type === "视频") {
        session.send(h.video(result.data.url))
      } else {
        images.forEach(async item => {
          session.send(h('img', { src: item }))
        });
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
