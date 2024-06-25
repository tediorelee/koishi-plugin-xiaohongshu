import { Context, Schema, segment, h } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-console'

export const name = 'xiaohongshu'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const api = 'https://api.mu-jie.cc/xhs?url='

export function apply(ctx: Context) {

  async function fetchFromAPI(url) {
    return await ctx.http.get(api + url);
  };

  ctx.middleware(async (session, next) => {
    if (!session.content.includes('xhslink.com')) return next()
    const urlRegex = /http:\/\/xhslink\.com\/\w+/;
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
          session.send(h.image(item))
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
