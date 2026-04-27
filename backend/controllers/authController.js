import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function register(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { name, email, phone, password, role, age, gender, specialization, licenseNumber } = data;
    console.log("[AuthController] Registration attempt:", email || phone);

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ error: "Name, email/phone, and password are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = (role || "PATIENT").toUpperCase();
    const userEmail = email || phone + "@placeholder.com";

    // Start Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          name,
          email: userEmail,
          password: hashedPassword,
          role: userRole,
          specialization: specialization || null,
          licenseNumber: licenseNumber || null,
          hospitalId: data.hospitalId || null
        },
        select: { id: true, name: true, email: true, role: true, hospitalId: true }
      });

      // If PATIENT, create Patient profile
      if (userRole === "PATIENT") {
        let dateOfBirth = null;
        if (age) {
           dateOfBirth = new Date();
           dateOfBirth.setFullYear(dateOfBirth.getFullYear() - parseInt(age, 10));
        }
        
        await tx.patient.create({
          data: {
             name,
             phone: phone || email, // Must be unique in schema
             email: email || null,
             userId: user.id,
             gender: gender ? gender.toUpperCase() : null,
             dateOfBirth,
             hospitalId: data.hospitalId || null
          }
        });
      }

      return user;
    });

    console.log("[AuthController] User created successfully:", result.id);
    return res.status(201).json({ message: "User registered successfully", user: result });
  } catch (error) {
    console.error("[AuthController] Registration Error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email or Phone already exists." });
    }
    return res.status(500).json({ error: "Registration failed", details: error.message });
  }
}

export async function login(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { email, password } = data;
    console.log("[AuthController] Login attempt for email:", email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.warn("[AuthController] Login failed: Invalid credentials for", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, hospitalId: user.hospitalId }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );
    console.log("[AuthController] Token generated for user:", user.id);

    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        isValid: true,
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      }
    });
    
    console.log("[AuthController] Session record created in DB:", session.id);

    const userWithHospital = await prisma.user.findUnique({
      where: { id: user.id },
      include: { hospital: true }
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        hospitalId: user.hospitalId,
        hospitalName: userWithHospital?.hospital?.name || null,
        hospitalAddress: userWithHospital?.hospital ? {
          doorNo: userWithHospital.hospital.doorNo,
          street: userWithHospital.hospital.street,
          area: userWithHospital.hospital.area,
          city: userWithHospital.hospital.city,
          state: userWithHospital.hospital.state,
          pincode: userWithHospital.hospital.pincode
        } : null
      },
    });
  } catch (error) {
    console.error("[AuthController] Login FATAL Error:", error);
    return res.status(500).json({ error: "Login failed", details: error.message });
  }
}
