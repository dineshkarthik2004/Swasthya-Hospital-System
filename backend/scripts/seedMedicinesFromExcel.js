import "dotenv/config";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Same composition parsing logic as original loadMedicines() ──────────────
const parseComposition = (composition, productForm) => {
  const dosageMatches = [...(composition || "").matchAll(/\((.*?)\)/g)];
  let generics = [];
  let dosages = [];

  if (dosageMatches.length > 0) {
    dosages = dosageMatches.map((m) => m[1]);
    generics = [
      (composition || "")
        .replace(/\(.*?\)/g, "")
        .replace(/\+/g, "/")
        .replace(/\s+/g, " ")
        .trim(),
    ];
  } else {
    generics = [composition || ""];
  }

  const formLower = (productForm || "").toLowerCase();
  let type = "Other";
  if (formLower.includes("tab")) type = "Tab";
  else if (formLower.includes("cap")) type = "Cap";
  else if (formLower.includes("syr") || formLower.includes("syp")) type = "Syp";
  else if (formLower.includes("inj")) type = "Inj";
  else if (formLower.includes("oint")) type = "Oint";

  return {
    generic: generics.join(" + "),
    dosage: dosages.join(" / "),
    type,
  };
};

// ─── Insert in batches — with resume support ──────────────────────────────────
// startFrom: skip this many rows at the beginning (already inserted)
// batchSize: rows per DB insert — larger = faster for remote DBs
const insertBatch = async (records, batchSize = 5000, startFrom = 0) => {
  let inserted = startFrom;
  const remaining = records.slice(startFrom);

  console.log(
    `  Resuming from row ${startFrom.toLocaleString()}, ${remaining.length.toLocaleString()} rows remaining...`
  );

  for (let i = 0; i < remaining.length; i += batchSize) {
    const batch = remaining.slice(i, i + batchSize);
    await prisma.medicine.createMany({ data: batch, skipDuplicates: false });
    inserted += batch.length;
    console.log(
      `  [Batch] Inserted ${inserted.toLocaleString()} / ${records.length.toLocaleString()}`
    );
  }
  return inserted;
};

async function main() {
  console.log("=".repeat(60));
  console.log("Medicine DB Seeder — Starting");
  console.log("=".repeat(60));

  // ── Check how many global medicines already in DB (resume support) ────────
  const existingGlobalCount = await prisma.medicine.count({
    where: { hospitalId: null },
  });

  if (existingGlobalCount >= 343788) {
    // Already fully seeded
    console.log(
      `\n✅ DB already has ${existingGlobalCount.toLocaleString()} global medicines — fully seeded. Skipping Excel.`
    );
  } else {
    // ── SEED GLOBAL MEDICINES from Medicine_List.xlsb ─────────────────────
    const xlsbPath = path.join(__dirname, "..", "Medicine_List.xlsb");

    if (!fs.existsSync(xlsbPath)) {
      console.error(`❌ Medicine_List.xlsb not found at: ${xlsbPath}`);
      process.exit(1);
    }

    console.log(`\n📂 Reading Medicine_List.xlsb (this may take a moment)...`);
    const workbook = xlsx.readFile(xlsbPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = xlsx.utils.sheet_to_json(sheet);
    console.log(`   Parsed ${excelData.length.toLocaleString()} rows from Excel.`);

    const globalRecords = excelData
      .map((item) => {
        const productName = (item["Product Name"] || "").trim();
        if (!productName) return null;

        const { generic, dosage, type } = parseComposition(
          item["Composition"] || "",
          item["Product Form"] || ""
        );

        return {
          name: productName,
          nameLower: productName.toLowerCase(),
          generic,
          dosage,
          type,
          hospitalId: null,
          hospitalName: null,
          sourceFile: "Medicine_List.xlsb",
        };
      })
      .filter(Boolean);

    if (existingGlobalCount > 0) {
      console.log(
        `\n⚡ Resuming from ${existingGlobalCount.toLocaleString()} already inserted global medicines...`
      );
    } else {
      console.log(
        `\n📥 Inserting ${globalRecords.length.toLocaleString()} global medicines into DB...`
      );
    }

    const totalInserted = await insertBatch(globalRecords, 5000, existingGlobalCount);
    console.log(
      `\n✅ Global medicines seeded: ${totalInserted.toLocaleString()} records`
    );
  }

  // ── SEED HOSPITAL MEDICINES from Hospital_Medicines.json ─────────────────
  const jsonPath = path.join(__dirname, "..", "Hospital_Medicines.json");

  if (!fs.existsSync(jsonPath)) {
    console.log("\n⚠️  Hospital_Medicines.json not found — skipping.");
  } else {
    let customData = [];
    try {
      customData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (e) {
      console.error("❌ Error reading Hospital_Medicines.json:", e.message);
    }

    if (customData.length === 0) {
      console.log("\n⚠️  Hospital_Medicines.json is empty — skipping.");
    } else {
      const hospitalIds = [
        ...new Set(customData.map((d) => d["Hospital ID"]).filter(Boolean)),
      ];

      const existingHospitalCount = await prisma.medicine.count({
        where: { hospitalId: { in: hospitalIds } },
      });

      if (existingHospitalCount > 0) {
        console.log(
          `\n✅ Hospital medicines already seeded (${existingHospitalCount} records found). Skipping.`
        );
      } else {
        const hospitalRecords = customData
          .map((item) => {
            const productName = (item["Product Name"] || "").trim();
            if (!productName) return null;

            const { generic, dosage, type } = parseComposition(
              item["Composition"] || "",
              item["Product Form"] || ""
            );

            return {
              name: productName,
              nameLower: productName.toLowerCase(),
              generic,
              dosage,
              type,
              hospitalId: item["Hospital ID"] || null,
              hospitalName: item["Hospital Name"] || null,
              sourceFile: item["Source File"] || "Hospital_Medicines.json",
            };
          })
          .filter(Boolean);

        console.log(
          `\n📥 Inserting ${hospitalRecords.length} hospital-specific medicines into DB...`
        );
        const hospitalInserted = await insertBatch(hospitalRecords, 5000, 0);
        console.log(`✅ Hospital medicines seeded: ${hospitalInserted} records`);
      }
    }
  }

  // ── Final count ───────────────────────────────────────────────────────────
  const totalInDB = await prisma.medicine.count();
  console.log("\n" + "=".repeat(60));
  console.log(
    `🎉 Seeding complete! Total medicines in DB: ${totalInDB.toLocaleString()}`
  );
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
