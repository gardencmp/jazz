import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export function Newsletter() {
  return (
    <>
      <div
        id="mlb2-5744530"
        className="ml-form-embedContainer ml-subscribe-form ml-subscribe-form-5744530"
      >
        <form
          action="https://static.mailerlite.com/webforms/submit/p5o0j8"
          method="post"
          target="_blank"
          data-code="p5o0j8"
          className="flex items-center bg-canvas rounded-sm overflow-hidden pr-[3px] text-fill"
        >
          <input
            aria-label="email"
            aria-required="true"
            type="email"
            className="px-w3 h-[calc(var(--height-button)+6px)] flex-1 placeholder:text-solid focus-visible:outline-none"
            data-inputmask=""
            name="fields[email]"
            placeholder="Your email"
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
          <Button
            type="submit"
            variant="ghost"
            className="rounded-none"
            PrefixIcon={<MailIcon className="size-em" />}
          >
            Subscribe
          </Button>
          <input type="hidden" name="anticsrf" value="true" />
        </form>

        {/* TODO: validation states */}
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
