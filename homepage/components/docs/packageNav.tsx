import { packages } from "./packageDocs";

export function PackageNav(props: { package: keyof typeof packages }) {
    const pkg = packages[props.package];

    return (
        <div className="not-prose">
            <h2>
                <code>{props.package}</code> API Reference
            </h2>
            {pkg.categories?.map((category, i) => (
                <h3 key={i} className="ml-2 text-sm">{category.title}</h3>
            ))}
        </div>
    );
}