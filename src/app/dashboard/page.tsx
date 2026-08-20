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
  const masteredCount = user.progress.filter(p => p.status === "Dominado").length;
  const familiarCount = user.progress.filter(p => p.status === "Familiar").length;
  const learningCount = user.progress.filter(p => p.status === "Aprendiendo").length;
  const unseenCount = Math.max(0, totalCountries - (masteredCount + familiarCount + learningCount));

  return (
    <DashboardClient 
      user={user} 
      totalCountries={totalCountries}
      masteredCount={masteredCount} 
      familiarCount={familiarCount}
      learningCount={learningCount} 
      unseenCount={unseenCount}
    />
  );
}
