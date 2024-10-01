"use client";

import { BookReview } from "../schema";
import { ID } from "jazz-tools";
import { useCoState } from "@/components/JazzAndAuth";
import Link from "next/link";
import { BookCover, BookCoverReadOnly } from "@/components/BookCover";
import StarIcon from "@/components/icons/StarIcon";

export function BookReviewThumbnail({ id }: { id: ID<BookReview> }) {
  const bookReview = useCoState(BookReview, id);

  if (!bookReview) return <></>;

  return (
    <div className="inline-flex shrink-0 gap-4 rounded border p-4 sm:block sm:space-y-6 sm:border-0 sm:p-0 md:w-[200px]">
      <Link href={`/book/${bookReview.id}`} className="sm:block sm:flex-1">
        <BookCoverReadOnly bookReview={bookReview} />
      </Link>

      <div className="flex-1">
        <Link href={`/book/${bookReview.id}`}>
          <h2 className="mb-1 text-sm font-medium">{bookReview.title}</h2>
        </Link>
        <div className="mb-2 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center">
          <p>{bookReview.author}</p>
          <div className="flex items-center gap-0.5 text-xs font-semibold leading-none">
            <StarIcon className="-mt-px text-base text-yellow-400" />
            {bookReview.rating}
          </div>
        </div>
      </div>
    </div>
  );
}
