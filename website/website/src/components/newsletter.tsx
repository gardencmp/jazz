import { MailIcon } from "lucide-react";

export function NewsletterButton() {
  return (
    <button
      onClick={() =>
        (window as any).ml_account("webforms", "5744530", "p5o0j8", "show")
      }
      className="flex items-center gap-2 px-2 py-1 text-black rounded bg-stone-300 hover:bg-stone-200 dark:bg-stone-950 dark:hover:bg-stone-800 dark:text-white"
    >
      <MailIcon className="" size="14" /> Subscribe
    </button>
  );
}

{
  /* <input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        className="max-w-[14rem] border border-stone-200 dark:border-stone-900 px-2 py-1 rounded w-full"
        /> */
}

export function Newsletter() {
  return (
    <>
      <div
        id="mlb2-5744530"
        className="ml-form-embedContainer ml-subscribe-form ml-subscribe-form-5744530"
      >
        <form
          className="flex gap-2"
          action="https://static.mailerlite.com/webforms/submit/p5o0j8"
          data-code="p5o0j8"
          method="post"
          target="_blank"
        >
          <input
            aria-label="email"
            aria-required="true"
            type="email"
            className="text-base form-control max-w-[18rem] border border-stone-300 dark:border-transparent shadow-sm dark:bg-stone-925 px-2 py-1 rounded w-full"
            data-inputmask=""
            name="fields[email]"
            placeholder="Email"
            autoComplete="email"
          />

          <input
            type="checkbox"
            className="hidden"
            name="groups[]"
            value="112132481"
            checked
            readOnly
          />
          <input
            type="checkbox"
            className="hidden"
            name="groups[]"
            value="111453104"
          />
          <input type="hidden" name="ml-submit" value="1" />
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-1 text-white rounded shadow-sm bg-stone-925 dark:bg-black hover:bg-stone-800"
          >
            <MailIcon className="" size="14" /> Subscribe
          </button>
          <input type="hidden" name="anticsrf" value="true" />
        </form>
        <div
          className="ml-form-successBody row-success"
          style={{ display: "none" }}
        >
          <div className="ml-form-successContent">
            <p>You&apos;re subscribed 🎉</p>
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
function ml_webform_success_5744530(){var r=ml_jQuery||jQuery;r(".ml-subscribe-form-5744530 .row-success").show(),r(".ml-subscribe-form-5744530 .row-form").hide()}
`,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://track.mailerlite.com/webforms/o/5744530/p5o0j8?v1697487427"
        width="1"
        height="1"
        style={{
          maxWidth: "1px",
          maxHeight: "1px",
          visibility: "hidden",
          padding: 0,
          margin: 0,
          display: "block",
        }}
        alt="."
      />
      <script
        src="https://static.mailerlite.com/js/w/webforms.min.js?vd4de52e171e8eb9c47c0c20caf367ddf"
        type="text/javascript"
        defer
      ></script>
    </>
  );
}
