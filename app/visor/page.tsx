import type { Metadata } from "next";
import VisorClient from "./VisorClient";

export const metadata: Metadata = {
  title: "Visor Cliente | PandaPOS",
};

export default function VisorPage() {
  return <VisorClient />;
}
