/* istanbul ignore file -- @preserve */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ItemsSym } from "./symbols.js";

(globalThis as any).devtoolsFormatters = [
  {
    header: (object: any) => {
      if (object._type === "CoMap") {
        return ["div", {}, ["span", {}, object.constructor.name]];
      } else if (object._type === "CoList") {
        return [
          "div",
          {},
          ["span", {}, object.constructor.name + "(" + object.length + ") "],
        ];
      } else if (object._type === "Account") {
        return [
          "div",
          {},
          [
            "span",
            {},
            object.constructor.name +
              "(" +
              object._refs.profile.value?.name +
              (object.isMe ? " ME" : "") +
              ")",
          ],
        ];
      } else {
        return null;
      }
    },
    hasBody: function () {
      return true;
    },
    body: function (object: any) {
      if (object._type === "CoMap" || object._type === "Account") {
        return [
          "div",
          { style: "margin-left: 15px" },
          ["div", "id: ", ["object", { object: object.id }]],
          ...Object.entries(object).map(([k, v]) => [
            "div",
            { style: "white-space: nowrap;" },
            ["span", { style: "font-weight: bold; opacity: 0.6" }, k, ": "],
            ["object", { object: v }],
            ...(typeof object._schema[k] === "function"
              ? v === null
                ? [
                    [
                      "span",
                      { style: "opacity: 0.5" },
                      ` (pending ${object._schema[k].name} `,
                      ["object", { object: object._refs[k] }],
                      ")",
                    ],
                  ]
                : []
              : []),
          ]),
        ];
      } else if (object._type === "CoList") {
        return [
          "div",
          { style: "margin-left: 15px" },
          ["div", "id: ", ["object", { object: object.id }]],
          ...(object as any[]).map((v, i) => [
            "div",
            { style: "white-space: nowrap;" },
            ["span", { style: "font-weight: bold; opacity: 0.6" }, i, ": "],
            ["object", { object: v }],
            ...(typeof object._schema[ItemsSym] === "function"
              ? v === null
                ? [
                    [
                      "span",
                      { style: "opacity: 0.5" },
                      ` (pending ${object._schema[ItemsSym].name} `,
                      ["object", { object: object._refs[i] }],
                      ")",
                    ],
                  ]
                : []
              : []),
          ]),
        ];
      }
    },
  },
];
