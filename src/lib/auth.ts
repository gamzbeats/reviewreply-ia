import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { restaurants: true },
  });

  return user;
}

export async function getOrCreateUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { restaurants: true },
  });

  if (!user) {
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || "",
        name:
          clerkUser?.firstName && clerkUser?.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser?.firstName || null,
        avatarUrl: clerkUser?.imageUrl || null,
        restaurants: {
          create: {
            name: "Mon restaurant",
          },
        },
      },
      include: { restaurants: true },
    });
  }

  return user;
}

export async function getActiveRestaurant(userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  return restaurant;
}
