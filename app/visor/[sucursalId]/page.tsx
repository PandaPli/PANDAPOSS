import type { Metadata } from "next";
import VisorClient from "./VisorClient";

export const metadata: Metadata = {
  title: "Visor Cliente | PandaPOS",
};

interface Props {
  params: Promise<{ sucursalId: string }>;
}

export default async function VisorPage({ params }: Props) {
  const { sucursalId } = await params;
  return <VisorClient sucursalId={Number(sucursalId)} />;
}
