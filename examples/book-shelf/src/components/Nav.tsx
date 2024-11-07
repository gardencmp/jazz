"use client";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { useAccount } from "@/components/JazzAndAuth";
import Link from "next/link";

export function Nav() {
  const { me, logOut } = useAccount();

  return (
    <nav className="border-b py-3">
      <Container className="flex items-center justify-between gap-12 text-sm">
        <Link href="/" className="font-serif text-lg font-semibold">
          Jazz Book Shelf
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <p>{me?.profile?.name}</p>
          <Button variant="secondary" onClick={logOut}>
            Log out
          </Button>
        </div>
      </Container>
    </nav>
  );
}
