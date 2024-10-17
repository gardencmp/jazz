import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { H2, H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { Grid } from "lucide-react";
import Products from "@/components/home/Products";
import Approach from "@/components/home/Approach";

export default function Home() {
    return (
        <div className="container space-y-16">
            <HeroHeader
                className=""
                title="Software is too hard."
                slogan="Computers are magic. So why do we put up with so much complexity? We believe just a few new ideas can make all the difference."
            />

            <Products />

            <Approach />
        </div>
    );
}
