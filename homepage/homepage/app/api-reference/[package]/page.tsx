import { PackageDocs } from "@/components/docs/packageDocs";
import { packages } from "@/lib/packages";
import { notFound } from "next/navigation";

interface Props {
  params: { package: string };
}

export default function Page({ params }: Props) {
  if (!packages.map((p) => p.name).includes(params.package)) {
    return notFound();
  }

  return <PackageDocs package={params.package} />;
}

export async function generateMetadata({ params }: Props) {
  const packageName = params.package;
  return {
    title: `${packageName} - jazz`,
    description: `API reference for ${packageName}.`,
  };
}

export async function generateStaticParams() {
  // TODO: ideally we check which files exist in ../../typedoc
  return packages.map((pkg) => ({ package: pkg.name }));
}
