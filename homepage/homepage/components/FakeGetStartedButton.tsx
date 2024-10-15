"use client";

import { Button } from "./Button";

export function FakeGetStartedButton() {
    return (
        <Button
            onClick={() => {
                alert(
                    "During the public alpha, please use your email address as the API key, as shown in the docs!"
                );
                window.location.pathname = "/docs";
            }}
            size="lg"
            variant="secondary"
        >
            Get started
        </Button>
    );
}
