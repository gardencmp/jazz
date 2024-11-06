"use client";

import { subscribe } from "@/app/actions/resend";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { Input } from "gcmp-design-system/src/app/components/molecules/Input";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { ErrorResponse } from "resend";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<ErrorResponse | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await subscribe(email);

    if (res.error) {
      setError(res.error);
    } else {
      setSubscribed(true);
    }
  };

  if (subscribed) {
    return (
      <div className="flex gap-3 items-center">
        <CheckIcon className="text-green-500" size={16} />
        <p>Thanks for subscribing!</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-700">Error: {error.message}</p>;
  }

  return (
    <form action="" onSubmit={submit} className="flex gap-x-4 w-120 max-w-xl">
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
      <Button type="submit" variant="secondary">
        Subscribe
      </Button>
    </form>
  );
}
