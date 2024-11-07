import Approach from "@/components/home/Approach";
import Products from "@/components/home/Products";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";

export default function Home() {
  return (
    <div className="container space-y-16">
      <HeroHeader
        title="Software is too hard."
        slogan="Computers are magic. So why do we put up with so much complexity? We believe just a few new ideas can make all the difference."
      />

      <Products />

      <Approach />
    </div>
  );
}
