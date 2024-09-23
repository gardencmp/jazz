"use client";

import { useAccount } from "../jazz-client";
import { Doc } from "../schema";
import { useRouter } from "next/navigation";

export function NewDocButton() {
  const { me } = useAccount();
  const router = useRouter();

  function createDoc() {
    if (!me) return;

    const document = Doc.create(
      {
        title: "Untitled",
        text: "Lorem ipsum...",
        tweet: "",
      },
      { owner: me }
    );

    setTimeout(() => {
      router.push(`/doc/${document.id}`);
    }, 200);
  }

  return (
    <button
      className={
        (me ? "bg-blue-500" : "bg-gray-500") +
        " text-white px-4 py-2 rounded-md"
      }
      onClick={createDoc}
      disabled={!me}
    >
      Create new document
    </button>
  );
}
