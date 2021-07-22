import { $Page } from "@mptool/enhance";

import { getImagePrefix } from "../utils/config";
import {
  getPath,
  loadOnlinePage,
  resolvePage,
  setOnlinePage,
} from "../utils/page";

import type { PageData, PageOption } from "../../typings";

$Page("page", {
  data: { page: {} as PageData & { id: string } },

  state: {
    /** 在线文件路径 */
    path: "",
  },

  onNavigate(option) {
    resolvePage(option);
  },

  onLoad(option: PageOption & { path?: string }) {
    console.info("onLoad options: ", option);

    // 生成页面 ID
    option.id = getPath(
      option.scene ? decodeURIComponent(option.scene) : option.id
    );

    if ("path" in option) {
      option.path = getPath(option.path);
      this.state.path = option.path;
      loadOnlinePage(option as Record<string, never> & { path: string }, this);
    } else setOnlinePage(option, this);

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);

    wx.reportEvent?.("page_id", { id: option.id || option.path });
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.page.title,
      path: `/module/page?${
        this.state.path
          ? `path=${this.state.path}`
          : `scene=${this.data.page.id}`
      }`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.page.title,
      query: `id=${this.data.page.id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.page.title,
      imageUrl: `${getImagePrefix()}.jpg`,
      query: `from=主页&id=${this.data.page.id}`,
    };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.onThemeChange);
  },

  /** 设置主题 */
  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },
});
