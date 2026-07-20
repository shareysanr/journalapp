import { prisma } from "../config/prisma";
import type { User } from "../generated/prisma/client";

export async function findOrCreateByCognitoSub(cognitoSub: string): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { cognitoSub }
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: { cognitoSub }
  });
}
