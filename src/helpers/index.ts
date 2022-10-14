export * from "./type-checks";
export * as facades from "./facades";
export * from "./botAlert";

export const getTgIdsFromAddress = (address: string) => {
  const userIds: any[] = require("../../userTgIds.json");
  const tgIds = [];
  for (const key of userIds) {
    if (key[1].toLowerCase() === address.toLowerCase()) {
      tgIds.push(key[0]);
    }
  }
  return userIds;
};

export const ammList = [
  "0x080486eedaf43c5bd8495fa5aeaca21ed23a58bf",
  "0x7d1ecca059f4c06669c66e4e5708f07fcb5d555d",
  "0x1b3e5d5bc9223e39581062f929dab6d1dc12c7ea",
];
export const getSide = (size: number) => {
  if (size > 0) return "💹 LONG";
  else return "🔻 SHORT";
};

export const priceKeys: any = {
  "0x080486eedaf43c5bd8495fa5aeaca21ed23a58bf": "AAPL",
  "0x7d1ecca059f4c06669c66e4e5708f07fcb5d555d": "AMD",
  "0x1b3e5d5bc9223e39581062f929dab6d1dc12c7ea": "SHOP",
};
