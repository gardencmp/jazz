import { Card, CardProps } from "../molecules/Card"

type CardSetProps = {
  cardSet: {
    card1: CardProps,
    card2: CardProps,
    card3: CardProps,
  }
}

export const CardSet = ({ cardSet }: CardSetProps ) => {
  return (
    <div className="my-20 grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-8">
      <div className="col-span-1">
        <Card {...cardSet.card1} />
      </div>
      <div className="col-span-1">
        <Card {...cardSet.card2} />
      </div>
      <div className="col-span-1">
        <Card {...cardSet.card3} />
      </div>
    </div>
  )
}