import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { seedTests } from "./seed-tests.js";
import { seedQuestoesDisc } from "./seed-disc.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      // Test database connection first
      console.log("Testing database connection...");
      const testQuery = await storage.getUserByUsername("test-connection");
      
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
        status: "ativa",
        email: "contato@gentepro.com",
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

      // Seed test data
      await seedTests();

      console.log("Seed data created successfully!");
      console.log("Master user: admin@gentepro.com / 123456");
      return;
    } catch (error) {
      retries--;
      console.error(`Error seeding database (${3 - retries}/3):`, error);
      
      if (retries > 0) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error("Failed to seed database after 3 attempts");
        throw error;
      }
    }
  }
}
