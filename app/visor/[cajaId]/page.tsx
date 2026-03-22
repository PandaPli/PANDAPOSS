import type { Metadata } from "next";
import VisorClient from "./VisorClient";

export const metadata: Metadata = {
  title: "Visor Cliente | PandaPOS",
};

interface Props {
  params: Promise<{ cajaId: string }>;
}

export default async function VisorPage({ params }: Props) {
  const { cajaId } = await params;
  return <VisorClient cajaId={Number(cajaId)} />;
}
