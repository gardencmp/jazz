import { PackageDocs } from "@/components/docs/packageDocs";

export const metadata = {
    title: "jazz-react - jazz",
    description: "API reference for jazz-react.",
};

export default function Page() {
    return <PackageDocs package="jazz-react" />;
}
