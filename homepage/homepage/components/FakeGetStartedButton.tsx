"use client";

import { Button } from "gcmp-design-system/src/app/components/atoms/Button";

export function FakeGetStartedButton() {
  return (
    <Button
      onClick={() => {
        alert(
          "During the public alpha, please use your email address as the API key, as shown in the docs!",
        );
        window.location.pathname = "/docs";
      }}
      size="md"
      variant="primary"
    >
      Get started
    </Button>
  );
}
