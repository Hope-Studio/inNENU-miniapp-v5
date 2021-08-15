import { $Page } from "@mptool/enhance";

import { getImagePrefix } from "../../utils/config";
import { ensureJSON, getJSON } from "../../utils/json";
import { getColor, popNotice } from "../../utils/page";
import { modal } from "../../utils/wx";

import type { AppOption } from "../../app";
import type { WechatDetail } from "../../../typings";

const { globalData } = getApp<AppOption>();

$Page("wechat-detail", {
  data: {
    config: {} as WechatDetail,

    /** 是否显示关注按钮 */
    follow: false,

    statusBarHeight: globalData.info.statusBarHeight,
    footer: {
      desc: "更新文章，请联系 QQ 1178522294",
    },
  },

  state: {
    path: "",
  },

  onNavigate(options) {
    ensureJSON(`function/wechat/${options.path || "index"}`);
  },

  onLoad({ path = "" }) {
    getJSON<WechatDetail>(`function/wechat/${path}`).then((wechat) => {
      this.setData({
        darkmode: globalData.darkmode,
        firstPage: getCurrentPages().length === 1,
        color: getColor(true),
        config: wechat,
        follow:
          wechat.authorized !== false &&
          "follow" in wechat &&
          globalData.env === "wechat",
      });
    });

    this.state.path = path;

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);

    popNotice(`wechat/${this.data.config.name}`);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.config.name,
      path: `/function/wechat/detail?path=${this.state.path}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.config.name,
      query: `path=${this.state.path}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.config.name,
      imageUrl: `${getImagePrefix()}.jpg`,
      query: `path=${this.state.path}`,
    };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.onThemeChange);
  },

  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  navigate({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    never,
    never,
    { title: string; url: string }
  >) {
    const { title, url } = currentTarget.dataset;

    // 无法跳转，复制链接到剪切板
    if (this.data.config.authorized === false)
      wx.setClipboardData({
        data: url,
        success: () => {
          modal(
            "尚未授权",
            "目前暂不支持跳转到该微信公众号图文，链接地址已复制至剪切板。请打开浏览器粘贴查看"
          );
        },
      });
    else if (globalData.env === "qq")
      wx.setClipboardData({
        data: url,
        success: () => {
          modal(
            "无法跳转",
            "QQ小程序并不支持跳转微信图文，链接地址已复制至剪切板。请打开浏览器粘贴查看"
          );
        },
      });
    else this.$go(`web?url=${url}&title=${title}`);
  },

  follow() {
    this.$go(`web?url=${this.data.config.follow as string}&title=欢迎关注`);
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});
