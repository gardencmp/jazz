import Image from "next/image";
// import { Hero } from "@/components/organisms/Hero";
// import { Headline } from "@/components/molecules/Headline";
// import { Title } from "@/components/atoms/Title";
// import { Body } from "@/components/atoms/Body";
// import { Card } from "@/components/molecules/Card";
// import { CardSet } from "@/components/organisms/CardSet";
import { Text, GridCard } from "@atoms";
import { HeaderHero } from "@molecules";

const catIpsumLong =
  "Shake treat bag. Vomit food and eat it again all of a sudden cat goes crazy murr i hate humans they are so annoying where is it? i saw that bird i need to bring it home to mommy squirrel! hack up furballs. Meeeeouw walk on keyboard and slap the dog because cats rule, and behind the couch. Catto munch salmono love the best thing in the universe is a cardboard box or favor packaging over toy cat ass trophy. I vomit in the bed in the middle of the night chase laser. Eat and than sleep on your face play riveting piece on synthesizer keyboard reward the chosen human with a slow blink plan your travel.";
const catIpsumShort = (
  <>
    Tuxedo cats <strong>always</strong> looking dapper chew iPad power cord, get
    away from me stupid dog for thinking about you i&rsquo;m joking it&rsquo;s
    food always food so roll on the floor purring your whiskers off
  </>
);
const catIpsumHeadline = (
  <>
    Need to check on <em>human</em>, have not seen in an hour might be dead
  </>
);

const card = {
  cardTitle: "Cats are awesome",
  text: catIpsumShort,
};

const cardSet = {
  card1: card,
  card2: card,
  card3: card,
};

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen px-24">
      {/* <Hero title="Title" subheading="Subheading" /> */}
      {/* <Headline headline="Headline" text={catIpsumHeadline} /> */}
      {/* <Title text="Title" /> */}
      {/* <Label text="text" /> */}
      {/* <Body text={catIpsumLong} /> */}
      {/* <Icon text="text" /> */}
      {/* <Button text="text" /> */}
      {/* <Card cardTitle="Cats are awesome" text={catIpsumShort} /> */}
      {/* <Body text={catIpsumShort} /> */}
      {/* <CardSet cardSet={cardSet} /> */}

      <Text as="h1" intent="display">
        Hey
      </Text>
      <GridCard>Hello</GridCard>
      <HeaderHero title="HeroHeader" slogan="HeroHeader Slogan"></HeaderHero>
    </main>
  );
}
