import { $Page } from "@mptool/enhance";
import { readJSON } from "@mptool/file";

import { defaultScroller } from "../../mixins/page-scroll";
import { getImagePrefix } from "../../utils/config";
import { getJSON } from "../../utils/file";
import { resolvePage, setPage } from "../../utils/page";

import type { AppOption } from "../../app";
import type { PageData } from "../../../typings";

const { globalData } = getApp<AppOption>();

$Page("location", {
  data: {
    page: {} as PageData,
  },

  state: {
    id: "",
  },

  onPreload(options) {
    resolvePage(options, readJSON(`function/map/${options.id}`));
  },

  onLoad(option) {
    if (option.id) {
      if (globalData.page.id === option.id) setPage({ option, ctx: this });
      else
        getJSON<PageData>({
          path: `function/map/${option.id}`,
          url: `resource/function/map/${option.id}`,
          success: (data) => {
            setPage({ option, ctx: this }, data);
          },
          fail: () => {
            setPage(
              { option, ctx: this },
              {
                error: true,
                statusBarHeight: globalData.info.statusBarHeight,
              }
            );
          },
        });

      this.state.id = option.id;
    }

    this.setData({
      statusBarHeight: globalData.info.statusBarHeight,
      firstPage: getCurrentPages().length === 1,
    });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);
  },

  /*
   * onReady() {
   *   this.marker = wx.getStorageSync(`${this.xiaoqu}-all`)[this.id];
   * },
   */

  /*
   * detail() {
   *   let markers = this.marker;
   *   wx.openLocation({
   *     latitude: marker.latitude,
   *     longitude: markers.longitude,
   *     name: markers.title,
   *   });
   * },
   */

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll(options) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.defaultScroller(options);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.page.title,
      path: `/function/map/location?id=${this.state.id}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.page.title,
      query: `id=${this.state.id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.page.title,
      imageUrl: `${getImagePrefix()}.jpg`,
      query: `id=${this.state.id}`,
    };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.onThemeChange);
  },

  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  defaultScroller,

  /** 返回按钮功能 */
  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});
