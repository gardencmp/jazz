import { HeroHeading } from '../atoms/Headings';

export const Hero = ({title, subheading}: {title: string, subheading: string}) => {
  return (
    <div className="container w-100 my-40 py-20">
      <HeroHeading>{title}</HeroHeading>
      <h2 className="text-3xl tracking-tight mt-5">
        {subheading}
      </h2>
    </div>
  );
};