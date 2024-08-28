import { ReactElement } from 'react';

type ReactText = string | number;
type ReactChild = ReactElement | ReactText;

type ReactNode = ReactChild

export const Body = ({text}:{text: ReactNode}) => {
  return (
    <p className="w-full mb-7">{text}</p>
  );
};

