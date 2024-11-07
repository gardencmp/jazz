import { Container } from "@/components/Container";
import UserProfile from "@/components/UserProfile";
import { JazzAccount } from "@/schema";
import { ID } from "jazz-tools";

export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

  return (
    <Container className="py-8">
      <UserProfile id={slug as ID<JazzAccount>} />
    </Container>
  );
}
