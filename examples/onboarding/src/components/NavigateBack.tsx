import { useNavigate } from "react-router-dom";
import { Button } from "./Button.tsx";

export function NavigateBack() {
  const navigate = useNavigate();
  const canGoBack = window.history.state.idx !== 0;

  if (!canGoBack) return null;

  return (
    <div>
      <Button onClick={() => navigate(-1)} text="< Back" />
    </div>
  );
}

export function NavigateButton({ text, to }: { text: string; to: string }) {
  const navigate = useNavigate();
  return (
    <div>
      <Button onClick={() => navigate(to)} text={text} />
    </div>
  );
}
