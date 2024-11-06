"use client";

import StarIcon from "@/components/icons/StarIcon";
import StarOutlineIcon from "@/components/icons/StarOutlineIcon";
import clsx from "clsx";

interface RatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  className?: string;
}

export default function RatingInput({
  value = 0,
  onChange,
  className,
}: RatingInputProps) {
  const handleChange = (newRating: number) => {
    onChange(newRating > 5 ? 5 : newRating);
  };

  return (
    <div className={clsx(className, "flex gap-0.5 text-2xl text-yellow-400")}>
      {[...Array(5)].map((_, i) => {
        return i < value ? (
          <button
            type="button"
            className="focus:outline-none"
            onClick={() => handleChange(i + 1)}
            key={i}
          >
            <StarIcon />
          </button>
        ) : (
          <button
            type="button"
            className="focus:outline-none"
            onClick={() => handleChange(i + 1)}
            key={i}
          >
            <StarOutlineIcon />
          </button>
        );
      })}
    </div>
  );
}
