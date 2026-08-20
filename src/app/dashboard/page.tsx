import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { FaFire, FaStar, FaGlobe, FaTrophy, FaMapMarkerAlt } from "react-icons/fa";
import LogoutButton from "./LogoutButton";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch user data including stats
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      progress: true
    }
  });

  if (!user) {
    redirect("/login");
  }

  const totalCountries = await prisma.country.count();
  const masteredCount = user.progress.filter(p => p.status === "Dominado").length;
  const learningCount = user.progress.filter(p => p.status === "Aprendiendo" || p.status === "Familiar").length;

  return <DashboardClient user={user} masteredCount={masteredCount} learningCount={learningCount} />;
}
