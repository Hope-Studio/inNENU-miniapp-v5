import { $Page } from "@mptool/enhance";

import { getImagePrefix } from "../../utils/config";
import { ensureJSON, getJSON } from "../../utils/json";
import { getColor, popNotice } from "../../utils/page";
import { modal, savePhoto, tip } from "../../utils/wx";

import type { AppOption } from "../../app";
import type { WechatConfig } from "../../../typings";

const { globalData } = getApp<AppOption>();
const { env } = globalData;

$Page("wechat-detail", {
  data: {
    config: {} as WechatConfig,
    statusBarHeight: globalData.info.statusBarHeight,
    footer: {
      desc: "更新文章，请联系 Mr.Hope",
    },
  },

  state: {
    path: "",
  },

  onNavigate(options) {
    if (options.path) ensureJSON(`function/account/${options.path}`);
  },

  onLoad({ path = "" }) {
    getJSON<WechatConfig>(`function/account/${path}`).then((config) => {
      this.setData({
        darkmode: globalData.darkmode,
        firstPage: getCurrentPages().length === 1,
        color: getColor(true),
        config,
      });
    });

    this.state.path = path;

    popNotice(`account/${this.data.config.name}`);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.config.name,
      path: `/function/account/detail?path=${this.state.path}`,
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

  navigate({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    never,
    never,
    { title: string; url: string }
  >) {
    const { title, url } = currentTarget.dataset;

    if (env === "qq")
      wx.setClipboardData({
        data: url,
        success: () => {
          modal(
            "无法跳转",
            "QQ小程序并不支持跳转微信图文，链接地址已复制至剪切板。请打开浏览器粘贴查看"
          );
        },
      });
    else if (this.data.config.authorized)
      this.$go(`web?url=${url}&title=${title}`);
    // 无法跳转，复制链接到剪切板
    else
      wx.setClipboardData({
        data: url,
        success: () => {
          modal(
            "尚未授权",
            "目前暂不支持跳转到该微信公众号图文，链接地址已复制至剪切板。请打开浏览器粘贴查看"
          );
        },
      });
  },

  follow() {
    const { follow, qrcode } = this.data.config;

    if (follow) this.$go(`web?url=${follow}&title=欢迎关注`);
    else if (env === "wx") wx.previewImage({ urls: [qrcode] });
    else
      savePhoto(qrcode)
        .then(() => tip("二维码已存至相册"))
        .catch(() => tip("二维码保存失败"));
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});