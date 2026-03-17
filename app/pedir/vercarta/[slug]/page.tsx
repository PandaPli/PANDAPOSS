import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * /pedir/vercarta/[slug]  →  redirige a /vercarta/[slug] (nueva URL canónica)
 */
export default async function VerCartaSlugRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/vercarta/${slug}`);
}
