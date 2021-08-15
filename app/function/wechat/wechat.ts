import { $Page } from "@mptool/enhance";

import { getImagePrefix } from "../../utils/config";
import { ensureJSON, getJSON } from "../../utils/json";
import { getColor, popNotice } from "../../utils/page";

import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();

interface WechatConfig {
  name: string;
  desc: string;
  logo: string;
  path: string;
}

$Page("wechat", {
  data: {
    theme: globalData.theme,

    /** 头部配置 */
    nav: {
      title: "校园公众号",
      from: "功能大厅",
    },

    wechat: [] as WechatConfig[],

    footer: {
      desc: "公众号入驻，请联系 QQ 1178522294",
    },
  },

  onNavigate() {
    ensureJSON("function/wechat/index");
  },

  onLoad({ from = "功能大厅" }) {
    getJSON<WechatConfig[]>("function/wechat/index").then((wechat) => {
      this.setData({
        color: getColor(),
        theme: globalData.theme,
        wechat,
        "nav.from": from,
      });
    });

    popNotice("wechat");
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage() {
    return { title: "校园公众号", path: `/function/wechat/wechat` };
  },

  onShareTimeline: () => ({ title: "校园公众号" }),

  onAddToFavorites: () => ({
    title: "校园公众号",
    imageUrl: `${getImagePrefix()}.jpg`,
  }),
});
