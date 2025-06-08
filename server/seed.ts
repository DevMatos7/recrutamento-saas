import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    // Check if master user already exists
    const existingUser = await storage.getUserByUsername("admin@gentepro.com");
    if (existingUser) {
      console.log("Seed data already exists, skipping...");
      return;
    }

    console.log("Creating seed data...");

    // Create GentePRO company
    const empresa = await storage.createEmpresa({
      nome: "GentePRO",
      cnpj: "12.345.678/0001-90",
    });

    // Create Administrativo department
    const departamento = await storage.createDepartamento({
      nome: "Administrativo",
      empresaId: empresa.id,
    });

    // Create master admin user
    const hashedPassword = await hashPassword("123456");
    await storage.createUser({
      nome: "Administrador Master",
      email: "admin@gentepro.com",
      password: hashedPassword,
      perfil: "admin",
      empresaId: empresa.id,
      departamentoId: departamento.id,
    });

    console.log("Seed data created successfully!");
    console.log("Master user: admin@gentepro.com / 123456");
  } catch (error) {
    console.error("Error creating seed data:", error);
  }
}
