"use client";

import { useState } from "react";
import { ErrorResponse } from "resend";
import { subscribe } from "../../../actions/resend";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Input } from "../molecules/Input";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  // const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<ErrorResponse | undefined>();

  const [state, setState] = useState<"ready" | "loading" | "success" | "error">(
    "ready",
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setState("loading");

    const res = await subscribe(email);

    if (res.error) {
      setError(res.error);
      setState("error");
    } else {
      setState("success");
    }
  };

  if (state === "success") {
    return (
      <div className="flex gap-3 items-center">
        <Icon name="check" className="text-green-500" />
        <p>Thanks for subscribing!</p>
      </div>
    );
  }

  if (state === "error" && error?.message) {
    return <p className="text-red-700">Error: {error.message}</p>;
  }

  return (
    <form action="" onSubmit={submit} className="flex gap-x-4 w-120 max-w-md">
      <Input
        id="email-address"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Enter your email"
        autoComplete="email"
        className="flex-1 label:sr-only"
        label="Email address"
      />
      <Button
        type="submit"
        variant="secondary"
        loadingText="Subscribing..."
        loading={state === "loading"}
        icon="newsletter"
      >
        Subscribe
      </Button>
    </form>
  );
}
