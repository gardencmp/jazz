import { createJazzBrowserContext as D, consumeInviteLinkFromWindowLocation as _, BrowserDemoAuth as B } from "jazz-browser";
import { Account as j, subscribeToCoValue as T } from "jazz-tools";
import { ref as y, defineComponent as R, provide as V, onMounted as P, watch as A, onUnmounted as I, computed as v, toRaw as b, shallowRef as M, inject as N, reactive as $, openBlock as g, createElementBlock as f, normalizeStyle as w, Fragment as k, createElementVNode as x, toDisplayString as C, renderList as E, withModifiers as F, withDirectives as G, vModelText as W, createCommentVNode as L, toRef as q, renderSlot as H, unref as J } from "vue";
const S = y(), O = Symbol("JazzContext");
function te({
  AccountSchema: p = j
} = {}) {
  const i = R({
    name: "JazzProvider",
    props: {
      auth: {
        type: [String, Object],
        required: !0
      },
      peer: {
        type: String,
        required: !0
      },
      storage: {
        type: String,
        default: void 0
      }
    },
    setup(r, { slots: o }) {
      const t = y(
        void 0
      ), n = y(0);
      V(O, t);
      const s = async () => {
        var e, u;
        t.value && ((u = (e = t.value).done) == null || u.call(e), t.value = void 0);
        try {
          const m = await D(
            r.auth === "guest" ? { peer: r.peer, storage: r.storage } : {
              AccountSchema: p,
              auth: r.auth,
              peer: r.peer,
              storage: r.storage
            }
          );
          t.value = {
            ...m,
            logOut: () => {
              var z;
              (z = S.value) == null || z.call(S), n.value += 1;
            }
          };
        } catch (m) {
          console.error("Error creating Jazz browser context:", m);
        }
      };
      return P(() => {
        s();
      }), A(
        () => n.value,
        async () => {
          await s();
        }
      ), I(() => {
        var e, u;
        t.value && ((u = (e = t.value).done) == null || u.call(e));
      }), () => {
        var e;
        return t.value ? (e = o.default) == null ? void 0 : e.call(o) : null;
      };
    }
  });
  function l() {
    const r = N(O);
    if (!r)
      throw new Error("useJazzContext must be used within a JazzProvider");
    return r;
  }
  function a(r) {
    const o = l();
    if (!o.value)
      throw new Error("useAccount must be used within a JazzProvider");
    if (!("me" in o.value))
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()"
      );
    const t = d(
      o.value.me.constructor,
      o.value.me.id,
      r
    );
    return {
      me: v(() => {
        const n = r === void 0 ? t.value || b(o.value.me) : t.value;
        return n && b(n);
      }),
      logOut: o.value.logOut
    };
  }
  function c(r) {
    const o = l();
    if (!o.value)
      throw new Error("useAccountOrGuest must be used within a JazzProvider");
    const t = "me" in o.value ? o.value.me : void 0, n = d(
      t == null ? void 0 : t.constructor,
      t == null ? void 0 : t.id,
      r
    );
    return "me" in o.value ? {
      me: v(
        () => r === void 0 ? n.value || b(o.value.me) : n.value
      )
    } : {
      me: v(() => b(o.value.guest))
    };
  }
  function d(r, o, t = []) {
    const n = M(void 0), s = l();
    if (!s.value)
      throw new Error("useCoState must be used within a JazzProvider");
    let e;
    return A(
      [() => o, () => s, () => r, () => t],
      () => {
        e && e(), o && (e = T(
          r,
          o,
          "me" in s.value ? b(s.value.me) : b(s.value.guest),
          t,
          (m) => {
            n.value = m;
          }
        ));
      },
      { immediate: !0 }
    ), I(() => {
      e && e();
    }), v(() => n.value);
  }
  function h({
    invitedObjectSchema: r,
    onAccept: o,
    forValueHint: t
  }) {
    const n = l();
    if (!n.value)
      throw new Error("useAcceptInvite must be used within a JazzProvider");
    if (!("me" in n.value))
      throw new Error(
        "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'."
      );
    const s = () => {
      _({
        as: b(n.value.me),
        invitedObjectSchema: r,
        forValueHint: t
      }).then((u) => u && o(u.valueID)).catch((u) => {
        console.error("Failed to accept invite", u);
      });
    };
    P(() => {
      s();
    }), A(
      () => o,
      (e, u) => {
        e !== u && s();
      }
    );
  }
  return {
    JazzProvider: i,
    useAccount: a,
    useAccountOrGuest: c,
    useCoState: d,
    useAcceptInvite: h
  };
}
function re({
  seedAccounts: p
} = {}) {
  const i = $({
    state: "loading",
    errors: []
  }), l = y(
    new B(
      {
        onReady: ({ signUp: a, existingUsers: c, logInAs: d }) => {
          i.state = "ready", i.signUp = a, i.existingUsers = c, i.logInAs = d, i.errors = [];
        },
        onSignedIn: ({ logOut: a }) => {
          i.state = "signedIn", i.logOut = () => {
            a(), i.state = "ready", i.errors = [];
          }, i.errors = [], S.value = i.logOut;
        },
        onError: (a) => {
          i.errors.push(a.toString());
        }
      },
      p
    )
  );
  return I(() => {
    i.state === "signedIn" && (S.value = void 0);
  }), { authMethod: l, state: i };
}
const K = { key: 0 }, Q = {
  key: 0,
  style: { display: "flex", "flex-direction": "column", gap: "0.5rem" }
}, X = ["onClick", "aria-label"], oe = /* @__PURE__ */ R({
  __name: "DemoAuthBasicUI",
  props: {
    appName: {},
    state: {}
  },
  setup(p) {
    const i = p, l = y(""), a = v(
      () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ), c = v(() => ({
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      padding: "1rem",
      maxWidth: "100vw",
      gap: "2rem",
      margin: "0",
      ...a.value ? { background: "#000" } : {}
    })), d = v(() => ({
      border: a.value ? "2px solid #444" : "2px solid #ddd",
      padding: "11px 8px",
      borderRadius: "6px",
      background: a.value ? "#000" : "#fff",
      color: a.value ? "#fff" : "#000"
    })), h = v(() => ({
      padding: "13px 5px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      background: a.value ? "#444" : "#ddd",
      color: a.value ? "#fff" : "#000"
    })), r = v(() => ({
      background: a.value ? "#0d0d0d" : "#eee",
      color: a.value ? "#fff" : "#000",
      padding: "0.5rem",
      border: "none",
      borderRadius: "6px"
    })), o = () => {
      i.state.signUp(l.value), l.value = "";
    }, t = (n) => {
      i.state.logInAs(n);
    };
    return (n, s) => (g(), f("div", {
      style: w(c.value)
    }, [
      n.state.state === "loading" ? (g(), f("div", K, "Loading...")) : n.state.state === "ready" ? (g(), f(k, { key: 1 }, [
        x("h1", {
          style: w({ color: a.value ? "#fff" : "#000", textAlign: "center" })
        }, C(n.appName), 5),
        (g(!0), f(k, null, E(n.state.errors, (e) => (g(), f("div", {
          key: e,
          style: { color: "red" }
        }, C(e), 1))), 128)),
        x("form", {
          onSubmit: F(o, ["prevent"]),
          style: { display: "flex", "flex-direction": "column", gap: "0.5rem" }
        }, [
          G(x("input", {
            "onUpdate:modelValue": s[0] || (s[0] = (e) => l.value = e),
            placeholder: "Display name",
            autoComplete: "webauthn",
            style: w(d.value)
          }, null, 4), [
            [W, l.value]
          ]),
          x("input", {
            type: "submit",
            value: "Sign up",
            style: w(h.value)
          }, null, 4)
        ], 32),
        n.state.existingUsers.length > 0 ? (g(), f("div", Q, [
          x("p", {
            style: w({
              color: a.value ? "#e2e2e2" : "#000",
              textAlign: "center",
              paddingTop: "0.5rem",
              borderTop: "1px solid",
              borderColor: a.value ? "#111" : "#e2e2e2"
            })
          }, " Log in as ", 4),
          (g(!0), f(k, null, E(n.state.existingUsers, (e) => (g(), f("button", {
            key: e,
            onClick: (u) => t(e),
            type: "button",
            "aria-label": `Log in as ${e}`,
            style: w(r.value)
          }, C(e), 13, X))), 128))
        ])) : L("", !0)
      ], 64)) : L("", !0)
    ], 4));
  }
}), ne = /* @__PURE__ */ R({
  __name: "ProgressiveImg",
  props: {
    image: {},
    maxWidth: {}
  },
  setup(p) {
    function i(c, d) {
      const h = y({});
      let r;
      const o = A(
        () => {
          var t;
          return [(t = c.value) == null ? void 0 : t.id, d];
        },
        () => {
          let t;
          return c.value ? c.value.subscribe({}, (s) => {
            var u, m;
            const e = s == null ? void 0 : s.highestResAvailable({ maxWidth: d });
            if (e) {
              if (e.res !== t) {
                t = e.res;
                const z = e.stream.toBlob();
                if (z) {
                  const U = URL.createObjectURL(z);
                  h.value = {
                    src: U,
                    res: e.res,
                    originalSize: (u = c.value) == null ? void 0 : u.originalSize
                  }, r && r(), r = () => {
                    setTimeout(() => URL.revokeObjectURL(U), 200);
                  };
                }
              }
            } else
              h.value = {
                src: s == null ? void 0 : s.placeholderDataURL,
                res: "placeholder",
                originalSize: (m = c.value) == null ? void 0 : m.originalSize
              };
          }) : void 0;
        }
      );
      return I(() => {
        o(), r && r();
      }), h;
    }
    const l = p, a = i(q(l, "image"), l.maxWidth);
    return (c, d) => H(c.$slots, "default", {
      src: J(a).src,
      res: J(a).res,
      originalSize: J(a).originalSize
    });
  }
});
export {
  oe as DemoAuthBasicUI,
  ne as ProgressiveImg,
  te as createJazzVueApp,
  S as logoutHandler,
  re as useDemoAuth
};
