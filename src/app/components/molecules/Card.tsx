import { ReactElement } from 'react';

type ReactText = string | number;
type ReactChild = ReactElement | ReactText;

type ReactNode = ReactChild

export type CardProps = { cardTitle: string, text: ReactNode }

export const Card = ({ cardTitle, text }: CardProps ) => {
  return (
    <div className="w-full bg-gray-400 rounded-md px-5 py-7 mb-7">
      <p className='mb-4 text-lg tracking-tight'>{cardTitle}</p>
      <p>{text}</p>
    </div>
  );
};