import { redirect } from "next/navigation";
import { routes } from "@/lib/app-routes";

export default function PlayTournamentPresetPage() {
  redirect(routes.playTournamentNew);
}
