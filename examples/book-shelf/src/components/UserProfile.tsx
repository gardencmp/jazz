"use client";

import { BookReviewThumbnail } from "@/components/BookReviewThumbnail";
import { Button } from "@/components/Button";
import { useCoState } from "@/components/JazzAndAuth";
import { JazzAccount, JazzProfile, ListOfBookReviews } from "@/schema";
import { Group, ID } from "jazz-tools";

export default function UserProfile({ id }: { id: ID<JazzAccount> }) {
  const user = useCoState(JazzAccount, id);
  const profile = useCoState(JazzProfile, user?.profile?.id);

  const bookReviews = useCoState(
    ListOfBookReviews,
    user?.profile?._refs.bookReviews?.id,
    [{}],
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-lg font-medium sm:text-2xl">
          {profile?.name}&apos;s book shelf
        </h1>
        {profile?._owner.castAs(Group).myRole() === "admin" && (
          <Button href="/add" variant="primary">
            Add book
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {bookReviews?.map((bookReview) => (
          <BookReviewThumbnail key={bookReview.id} id={bookReview.id} />
        ))}
      </div>
    </div>
  );
}
