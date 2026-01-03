
import { dataService } from './dataService';

/**
 * MASTER DEPARTMENT DATA
 * Organized by Business Section -> Functional Unit
 */
const DEPARTMENT_MAP = {
  "Knockout": [
    "Admin Department",
    "Vehicle Maintenance",
    "Production Maintenance Department",
    "General hand / Maintenance",
    "Stores & Dispatch",
    "Sales Team",
    "Sales Promoters Department",
    "Shop Reliefer Department",
    "Shop Attendants Department",
    "Drivers Department",
    "Production - Mixing",
    "Production - Dishwasher Filling",
    "Production - Shrink Tunnel",
    "Production - Date Coding",
    "Labeling & Date Coding",
    "Loading Department",
    "Toilet Cleaners - Filling",
    "Quality Control",
    "Toilet Cleaners - Labelling",
    "Petroleum Jelly Department",
    "Scouring Powder Department",
    "Production Part-time",
    "Canteen Department"
  ],
  "Matina": [
    "Admin Department",
    "Stores Department",
    "Sales Team Department",
    "Drivers and Assistance Department",
    "Laboratory Department",
    "Production - Mixers",
    "Batching Department",
    "Rotary Line Department",
    "Manual Packing Department",
    "Concentrates Mixing Department",
    "Brook Waters Department",
    "Labeling Machine Department",
    "Manual Labeling Department"
  ]
};

export const seedService = {
  /**
   * Runs the seeding operation for the Departments collection only.
   * Employees must be added manually by administrators.
   */
  run: async (onProgress: (percent: number, status: string) => void) => {
    try {
      // 1. Verification: Only seed if the department list is empty
      const existingDepts = await dataService.getDepartments();
      if (existingDepts.length > 5) {
        console.log("Department registry already seeded. Skipping operation.");
        onProgress(100, "Registry check complete.");
        return;
      }

      // 2. Preparation: Flatten the hierarchy into full names
      const flatDepartments: string[] = [];
      Object.entries(DEPARTMENT_MAP).forEach(([section, depts]) => {
        depts.forEach(deptName => {
          flatDepartments.push(`${section} - ${deptName}`);
        });
      });

      const total = flatDepartments.length;
      let current = 0;

      console.log(`Seeding ${total} unique departments into Firestore...`);
      onProgress(5, "Analyzing department hierarchy...");

      // 3. Execution: Sequential seeding
      for (const dName of flatDepartments) {
        await dataService.addDepartment(dName);
        current++;
        
        const percent = Math.round((current / total) * 100);
        if (current % 5 === 0 || current === total) {
          onProgress(percent, `Syncing Department: ${dName}`);
        }
      }

      onProgress(100, "Department directory fully synchronized.");
      console.log("Seeding process completed successfully.");
    } catch (err) {
      console.error("Seeding Error:", err);
      onProgress(0, "Seeding failed. Check console.");
    }
  }
};
