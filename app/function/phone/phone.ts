import { $Page } from "@mptool/enhance";

import { getImagePrefix } from "../../utils/config";
import { ensureJSON, getJSON } from "../../utils/json";
import { popNotice } from "../../utils/page";
import { modal } from "../../utils/wx";

import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();
const { env } = globalData;

interface PhoneItemConfig {
  name: string;
  num: number | string;
  locate?: "benbu" | "jingyue";
}

interface PhoneConfig {
  name: string;
  list: PhoneItemConfig[];
}

$Page("phone", {
  data: {
    config: [] as PhoneConfig[],
    info: globalData.info,
  },

  onNavigate() {
    ensureJSON("function/phone/index");
  },

  onLoad() {
    getJSON<PhoneConfig[]>("function/phone/index").then((config) => {
      this.setData({ config, info: globalData.info });
    });

    popNotice("account");
  },

  onShareAppMessage: () => ({
    title: "师大黄页",
    path: `/function/phone/phone`,
  }),

  onShareTimeline: () => ({ title: "师大黄页" }),

  onAddToFavorites: () => ({
    title: "师大黄页",
    imageUrl: `${getImagePrefix()}.jpg`,
  }),

  getConfig({
    currentTarget,
  }: WechatMiniprogram.Touch<
    // eslint-disable-next-line @typescript-eslint/ban-types
    {},
    WechatMiniprogram.TouchDetail,
    // eslint-disable-next-line @typescript-eslint/ban-types
    {},
    { group: number; index: number }
  >): PhoneItemConfig {
    const { group, index } = currentTarget.dataset;

    return this.data.config[group].list[index];
  },

  getNumber(config: PhoneItemConfig): string {
    const num = config.num.toString();

    return num.length === 8 ? `0431-${num}` : num;
  },

  call(
    event: WechatMiniprogram.Touch<
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      WechatMiniprogram.TouchDetail,
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      { group: number; index: number }
    >
  ) {
    wx.makePhoneCall({
      phoneNumber: this.getNumber(this.getConfig(event)),
    });
  },

  addContact(
    event: WechatMiniprogram.Touch<
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      WechatMiniprogram.TouchDetail,
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      { group: number; index: number }
    >
  ) {
    const item = this.getConfig(event);

    if (env === "qq")
      wx.setClipboardData({
        data: this.getNumber(item),
        success: () => {
          modal(
            "号码已复制到剪切板",
            "QQ暂不支持直接添加联系人，请自行添加联系人"
          );
        },
      });
    else
      wx.addPhoneContact({
        // 添加联系人
        firstName: item.name,
        hostNumber: this.getNumber(item),
        org: "东北师范大学",
        postCode: '"130024',
        ...(item.locate === "benbu"
          ? { street: "吉林省长春市人民大街5268号" }
          : item.locate === "jingyue"
          ? { street: "吉林省长春市净月大街2555号" }
          : {}),
      });
  },
});