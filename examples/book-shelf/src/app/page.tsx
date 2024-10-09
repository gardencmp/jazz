"use client";

import { useAccount } from "@/components/JazzAndAuth";
import UserProfile from "@/components/UserProfile";
import { JazzAccount } from "@/schema";
import { ID } from "jazz-tools";
import { Container } from "@/components/Container";

export default function Home() {
  const { me } = useAccount();

  return (
    <Container className="grid gap-12 py-8">
      <UserProfile id={me?.id as ID<JazzAccount>} />

      <label className="flex flex-wrap items-center gap-3">
        Share your profile:
        <input
          type="text"
          className="w-full rounded border p-1"
          value={`http://localhost:3000/user/${me?.id}`}
          readOnly
        />
      </label>
    </Container>
  );
}
