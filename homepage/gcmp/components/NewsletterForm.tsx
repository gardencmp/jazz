"use client";

import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { useState } from "react";
import { subscribe } from "@/app/actions/resend";
import { ErrorResponse } from "resend";
import { CheckIcon } from "lucide-react";

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
        <form action="" onSubmit={submit} className="flex gap-x-4 max-w-md">
            <label htmlFor="email-address" className="sr-only">
                Email address
            </label>
            <input
                id="email-address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                autoComplete="email"
                className="min-w-0 flex-auto rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            <Button type="submit" variant="secondary">
                Subscribe
            </Button>
        </form>
    );
}
