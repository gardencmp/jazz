import { PackageDocs } from "@/components/docs/packageDocs";

export const metadata = {
    title: "jazz-browser - jazz",
    description: "API reference for jazz-browser.",
};

export default function Page() {
    return <PackageDocs package="jazz-browser" />;
}
