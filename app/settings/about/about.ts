import { $Page } from "@mptool/enhance";

import { getImagePrefix } from "../../utils/config";
import { popNotice, resolvePage, setPage } from "../../utils/page";
import { requestJSON, tip } from "../../utils/wx";

import type { AppOption } from "../../app";
import type {
  AdvancedListComponentConfig,
  ComponentConfig,
  PageDataWithContent,
  SwitchListComponentItemConfig,
} from "../../../typings";

const { globalData } = getApp<AppOption>();
let clickNumber = 0;
let developMode = false;

$Page("about", {
  data: {
    theme: globalData.theme,
    darkmode: globalData.darkmode,
    page: {
      title: "关于",
      desc: `当前版本: ${globalData.version}`,
      grey: true,
      content: [
        {
          tag: "advanced-list",
          header: "版本号",
          content: [
            { text: globalData.version, type: "button", handler: "debugMode" },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            {
              text: "启用测试功能",
              type: "switch",
              key: "test",
              handler: "toggleTest",
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            {
              text: "调试开关",
              type: "switch",
              key: "debugMode",
              handler: "toggleDebug",
            },
            { text: "退出开发者模式", type: "button", handler: "debugMode" },
          ],
        } as AdvancedListComponentConfig,
        { tag: "loading" },
      ],
    } as PageDataWithContent,
  },

  onNavigate(res) {
    const { page } = this.data;

    // 读取开发者模式并对页面显示做相应改变
    if (wx.getStorageSync<boolean | undefined>("developMode"))
      developMode = true;
    if (!developMode)
      (page.content[0] as AdvancedListComponentConfig).content.forEach(
        (x, y) => {
          x.hidden = y !== 0;
        }
      );

    resolvePage(res, page);
  },

  onLoad(option) {
    if (globalData.page.id === "关于") setPage({ option, ctx: this });
    else {
      const { page } = this.data;

      // 读取开发者模式并对页面显示做相应改变
      if (wx.getStorageSync<boolean | undefined>("developMode"))
        developMode = true;
      if (!developMode)
        (page.content[0] as AdvancedListComponentConfig).content.forEach(
          (x, y) => {
            x.hidden = y !== 0;
          }
        );

      setPage({ option: { id: "about" }, ctx: this }, page);
    }

    popNotice("about");
  },

  onReady() {
    // 读取在线文件更新页面显示
    requestJSON<ComponentConfig[]>(
      `resource/config/${globalData.appID}/${globalData.version}/about`
    )
      .then((data: ComponentConfig[]) => {
        setPage(
          { option: { id: "关于" }, ctx: this },
          {
            ...this.data.page,
            content: this.data.page.content.slice(0, 1).concat(data),
          }
        );
      })
      .catch(() => {
        setPage(
          { option: { id: "关于" }, ctx: this },
          {
            ...this.data.page,
            content: this.data.page.content.slice(0, 1),
          }
        );
      });
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: "关于",
    path: "/settings/about/about",
    imageUrl: `${getImagePrefix()}Share.png`,
  }),

  onShareTimeline: () => ({ title: "关于" }),

  onAddToFavorites: () => ({
    title: "关于",
    imageUrl: `${getImagePrefix()}.jpg`,
  }),

  /** 点击版本号时触发的函数 */
  debugMode() {
    // 关闭开发者模式
    if (developMode) {
      wx.setStorageSync("developMode", false);
      (
        this.data.page.content[0] as AdvancedListComponentConfig
      ).content.forEach((x, y) => {
        x.hidden = y !== 0;
      });
      this.setData({ page: this.data.page });
      clickNumber = 0;
      developMode = false;

      // 不做任何操作
    } else if (clickNumber < 5) clickNumber += 1;
    // 提示还有几次点击即可启用开发者模式
    else if (clickNumber < 10) {
      tip(`再点击${10 - clickNumber}次即可启用开发者模式`);
      clickNumber += 1;

      // 启用开发者模式
    } else
      this.setData({ debug: true }, () => {
        wx.nextTick(() => {
          this.setData({ focus: true });
        });
      });
  },

  /**
   * 输入密码时出发的函数
   * 用于判断密码是否正确并启用开发者模式
   *
   * @param event 输入事件
   */
  password(event: WechatMiniprogram.Input) {
    if (event.detail.value.length === 7) {
      // 密码正确
      if (event.detail.value === "5201314") {
        tip("已启用开发者模式");
        (
          this.data.page.content[0] as AdvancedListComponentConfig
        ).content.forEach((x) => {
          x.hidden = false;
        });
        this.setData({ page: this.data.page, debug: false });
        wx.setStorageSync("developMode", true);
        developMode = true;
      } else {
        // 密码错误
        wx.showToast({
          title: "密码错误",
          icon: "none",
          duration: 1000,
          image: "/icon/error.png",
        });
        this.setData({ debug: false });
      }

      // 清空输入框
      event.detail.value = "";
    }

    return event.detail.value;
  },

  /** 取消输入 */
  cancelInput() {
    this.setData({ debug: false });
  },

  /**
   * 控制调试开关
   *
   * @param value 开关状态
   */
  toggleDebug(value: boolean) {
    (
      (this.data.page.content[0] as AdvancedListComponentConfig)
        .content[2] as SwitchListComponentItemConfig
    ).status = value;
    this.setData({ page: this.data.page });
    wx.setStorageSync("debugMode", value);

    wx.setEnableDebug({ enableDebug: value });
    (wx.env as Record<string, unknown>).DEBUG = value;
  },

  /**
   * 控制测试功能开关
   *
   * @param value 开关状态
   */
  toggleTest(value: boolean) {
    tip(`已${value ? "启用" : "关闭"}测试功能`);
  },
});
