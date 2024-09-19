import { PackageDocs } from "@/components/docs/packageDocs";

export const metadata = {
    title: "jazz-tools - jazz",
    description: "API reference for jazz-tools.",
};

export default function Page() {
    return <PackageDocs package="jazz-tools" />;
}
