import { PrismaClient } from "@prisma/client";

export class PrismaClientSingleton {
    static instance: PrismaClientSingleton;
    prisma: PrismaClient;
    constructor() {
        this.prisma = new PrismaClient();
    }
    static getInstance() {
        if (!PrismaClientSingleton.instance) {
            PrismaClientSingleton.instance = new PrismaClientSingleton();
        }
        return PrismaClientSingleton.instance;
    }
}