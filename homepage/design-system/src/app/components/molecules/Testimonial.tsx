export function Testimonial({
    children,
    name,
    role,
}: {
    children: React.ReactNode;
    name: string;
    role: string;
}) {
    return (
        <figure className="max-w-2xl">
            <svg
                className="size-8 text-blue"
                fill="currentColor"
                viewBox="0 0 32 32"
                aria-hidden="true"
            >
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z"></path>
            </svg>
            <blockquote className="mt-6 text-balance font-medium leading-8 text-stone-900 sm:text-lg dark:text-white">
                {children}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-x-6">
                <div className="text-sm leading-6 sm:text-base">
                    <div className="font-semibold text-stone-900 dark:text-white">{name}</div>
                    <div className="mt-0.5 text-stone-600 dark:text-stone-500">{role}</div>
                </div>
            </figcaption>
        </figure>
    );
}
