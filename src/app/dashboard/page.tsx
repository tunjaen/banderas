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

  const totalCountries = await prisma.country.count() || 244;
  const masteredCount = user.progress.filter(p => p.status === "Dominado" || p.status === "MASTERED").length;
  const familiarCount = user.progress.filter(p => p.status === "Familiar" || p.status === "FAMILIAR").length;
  const learningCount = user.progress.filter(p => p.status === "Aprendiendo" || p.status === "LEARNING").length;
  const unseenCount = Math.max(0, totalCountries - (masteredCount + familiarCount + learningCount));

  // Check if ALL island countries in DB are at least "Familiar" or "Dominado"
  const islandCountries = await prisma.country.findMany({
    where: { continent: "Islas" },
    select: { id: true }
  });
  const islandIds = islandCountries.map(c => c.id);
  const userProgressMap = new Map(user.progress.map(p => [p.countryId, p.status]));
  const isIslandExpert = islandIds.length > 0 && islandIds.every(id => {
    const status = userProgressMap.get(id);
    return status === "Familiar" || status === "Dominado" || status === "FAMILIAR" || status === "MASTERED";
  });

  return (
    <DashboardClient 
      user={user} 
      totalCountries={totalCountries}
      masteredCount={masteredCount} 
      familiarCount={familiarCount}
      learningCount={learningCount} 
      unseenCount={unseenCount}
      isIslandExpert={isIslandExpert}
    />
  );
}
