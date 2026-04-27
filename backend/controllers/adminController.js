import { prisma } from "../config/db.js";

// --- Hospitals Management ---
export async function getHospitals(req, res) {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { _count: { select: { users: true } } }
    });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hospitals" });
  }
}

export async function createHospital(req, res) {
  try {
    const { name, email, phone, address, serviceFee, featuresEnabled } = req.body;
    const hospital = await prisma.hospital.create({
      data: { name, email, phone, address, serviceFee: parseFloat(serviceFee || 0), featuresEnabled }
    });
    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ error: "Failed to create hospital" });
  }
}

export async function updateHospital(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.serviceFee) data.serviceFee = parseFloat(data.serviceFee);
    const hospital = await prisma.hospital.update({
      where: { id },
      data
    });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: "Failed to update hospital" });
  }
}

export async function deleteHospital(req, res) {
  try {
    const { id } = req.params;
    await prisma.hospital.delete({ where: { id } });
    res.json({ message: "Hospital deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete hospital" });
  }
}

// --- Doctors Management ---
export async function getDoctors(req, res) {
  try {
    const where = { role: "DOCTOR" };
    if (req.user.hospitalId) {
      where.hospitalId = req.user.hospitalId;
    }
    const doctors = await prisma.user.findMany({
      where,
      include: { hospital: true }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
}

// --- Patients Management ---
export async function getPatients(req, res) {
  try {
    const where = {};
    if (req.user.hospitalId) {
      where.hospitalId = req.user.hospitalId;
    }
    const patients = await prisma.patient.findMany({
      where,
      include: { visits: true }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
}

// --- Payments Management ---
export async function getHospitalPayments(req, res) {
  try {
    const where = {};
    if (req.user.hospitalId) {
      where.hospitalId = req.user.hospitalId;
    }
    const payments = await prisma.hospitalPayment.findMany({
      where,
      include: { hospital: true }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
}

export async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, paymentDate } = req.body;
    const payment = await prisma.hospitalPayment.update({
      where: { id },
      data: { status, paymentDate: paymentDate ? new Date(paymentDate) : undefined }
    });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update payment" });
  }
}

// --- System Settings ---
export async function getSettings(req, res) {
  try {
    const settings = await prisma.systemSettings.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
}

export async function updateSetting(req, res) {
  try {
    const { key, value } = req.body;
    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: "Failed to update setting" });
  }
}

// --- Hospital Admin Dashboard ---
export async function getHospitalDashboardStats(req, res) {
  try {
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) {
      return res.status(400).json({ error: "Hospital ID required for this dashboard" });
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [patientCount, todayVisits, unpaidVisits, revenue] = await Promise.all([
      prisma.patient.count({ where: { hospitalId } }),
      prisma.visit.count({ 
        where: { 
          hospitalId, 
          createdAt: { gte: today, lt: tomorrow } 
        } 
      }),
      prisma.visit.count({ 
        where: { 
          hospitalId, 
          paymentStatus: "UNPAID" 
        } 
      }),
      prisma.visit.aggregate({
        where: { 
          hospitalId, 
          paymentStatus: "PAID" 
        },
        _count: true // Placeholder: in real app we'd sum actual fee values
      })
    ]);

    // Mock revenue calculation for now: $50 per paid visit
    const estimatedRevenue = (revenue._count || 0) * 50;

    res.json({
      totalPatients: patientCount,
      todayVisits: todayVisits,
      pendingPayments: unpaidVisits,
      revenue: estimatedRevenue
    });
  } catch (error) {
    console.error("[AdminController] Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}
