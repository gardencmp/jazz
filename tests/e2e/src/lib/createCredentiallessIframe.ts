/**
 * Creates a credentialess iframe that can be used to test the sync
 * in an isolated environment. (no storage sharing)
 *
 * see: https://developer.mozilla.org/en-US/docs/Web/Security/IFrame_credentialless
 */
export function createCredentiallessIframe(url: string) {
  const iframe = document.createElement("iframe");
  // @ts-ignore
  iframe.credentialless = true;
  iframe.src = url;
  iframe.style.width = "300px";
  iframe.style.height = "300px";
  iframe.style.border = "1px solid black";
  iframe.style.position = "absolute";
  iframe.style.top = "0";
  iframe.style.right = "0";
  iframe.setAttribute("data-testid", "downloader-peer");

  return iframe;
}
