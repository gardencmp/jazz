export const Display = (
  { title, subheading } : 
    {title: string, subheading: string}
) => {
  return (
    <>
      <h1 className="text-7xl mb-7 tracking-tight">
        {title}
      </h1>
    </>
  );
};