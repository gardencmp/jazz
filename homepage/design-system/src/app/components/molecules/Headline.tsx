import { ReactElement } from 'react';

type ReactText = string | number;
type ReactChild = ReactElement | ReactText;

export const Headline = (
  { headline, text }:
  { headline: string, text: ReactChild }
) => {
  return (
    <div className="w-full mb-20">
      <h3 className="text-2xl tracking-tight mb-4">
        {headline}
      </h3>
      <p>{text}</p>
    </div>
  );
};