import Image, { ImageProps } from "next/image";

export const RoundedImage = (props: ImageProps) => {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image className="rounded-lg" {...props} />;
};
