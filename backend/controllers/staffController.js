import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";

// GET /api/staff
export async function listStaff(req, res) {
  try {
    console.log("[StaffController] Listing all staff members");
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ["DOCTOR", "RECEPTIONIST", "LAB_TECH"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        specialization: true,
        licenseNumber: true,
        qualification: true,
        clinicName: true,
        doorNo: true,
        street: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    console.log("[StaffController] Found", staff.length, "staff members");
    return res.status(200).json(staff || []);
  } catch (error) {
    console.error("[StaffController] Error listing staff:", error);
    return res.status(500).json({ error: "Failed to list staff" });
  }
}

// GET /api/staff/doctors
export async function listDoctors(req, res) {
  try {
    console.log("[StaffController] Listing active doctors");
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR", isActive: true },
      select: {
        id: true,
        name: true,
        specialization: true,
        qualification: true,
        clinicName: true,
        doorNo: true,
        street: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        phone: true
      },
      orderBy: { name: "asc" }
    });

    console.log("[StaffController] Found", doctors.length, "active doctors");
    return res.status(200).json(doctors);
  } catch (error) {
    console.error("[StaffController] Error listing doctors:", error);
    return res.status(500).json({ error: "Failed to list doctors" });
  }
}

// POST /api/staff/create
export async function createStaff(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { name, email, password, role, specialization, licenseNumber, phone, qualification, clinicName, doorNo, street, area, city, state, pincode } = data;
    console.log("[StaffController] Creating new staff:", { name, email, role });

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role.toUpperCase(),
        specialization: specialization || null,
        licenseNumber: licenseNumber || null,
        qualification: qualification || null,
        clinicName: clinicName || null,
        doorNo: doorNo || null,
        street: street || null,
        area: area || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        specialization: true,
        licenseNumber: true,
        qualification: true,
        clinicName: true,
        doorNo: true,
        street: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log("[StaffController] Staff created successfully:", newUser.id);
    return res.status(201).json(newUser);
  } catch (error) {
    console.error("[StaffController] Error creating staff:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already exists." });
    }
    return res.status(500).json({ error: "Failed to create staff member", details: error.message });
  }
}

// PUT /api/staff/:id
export async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const reqData = req.body;
    if (!reqData || typeof reqData !== "object") return res.status(400).json({ error: "Invalid input" });
    const { name, email, specialization, licenseNumber, role, phone, qualification, clinicName, doorNo, street, area, city, state, pincode } = reqData;
    console.log("[StaffController] Updating staff:", id);

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (specialization !== undefined) data.specialization = specialization;
    if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
    if (role) data.role = role.toUpperCase();
    if (phone !== undefined) data.phone = phone;
    if (qualification !== undefined) data.qualification = qualification;
    if (clinicName !== undefined) data.clinicName = clinicName;
    if (doorNo !== undefined) data.doorNo = doorNo;
    if (street !== undefined) data.street = street;
    if (area !== undefined) data.area = area;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (pincode !== undefined) data.pincode = pincode;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        licenseNumber: true,
        qualification: true,
        clinicName: true,
        doorNo: true,
        street: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log("[StaffController] Staff updated successfully:", updated.id);
    return res.status(200).json(updated);
  } catch (error) {
    console.error("[StaffController] Error updating staff:", error);
    return res.status(500).json({ error: "Failed to update staff profile" });
  }
}

// PATCH /api/staff/:id/status
export async function toggleStaffStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    console.log("[StaffController] Toggling staff status:", id, "-> isActive:", isActive);

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: isActive },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    console.log("[StaffController] Staff status updated:", updated.name, "is now", updated.isActive ? "ACTIVE" : "INACTIVE");
    return res.status(200).json(updated);
  } catch (error) {
    console.error("[StaffController] Error toggling staff status:", error);
    return res.status(500).json({ error: "Failed to toggle staff status" });
  }
}
