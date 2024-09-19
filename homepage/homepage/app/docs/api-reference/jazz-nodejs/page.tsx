import { PackageDocs } from "@/components/docs/packageDocs";

export const metadata = {
    title: "jazz-nodejs - jazz",
    description: "API reference for jazz-nodejs.",
};

export default function Page() {
    return <PackageDocs package="jazz-nodejs" />;
}
