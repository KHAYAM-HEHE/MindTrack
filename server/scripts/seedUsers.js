const path = require("path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const UserProfile = require("../src/models/UserProfile");
const ProfessionalProfile = require("../src/models/ProfessionalProfile");
const { ROLES } = require("../src/utils/constants");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const demoUsers = [
  // Admin
  {
    name: "Admin User",
    email: "admin@mindtrack.com",
    password: "112233",
    role: ROLES.ADMIN,
    phone: "+1-555-0001",
  },
  // HR Employee
  {
    name: "HR Manager",
    email: "hr@mindtrack.com",
    password: "112233",
    role: ROLES.HR,
    phone: "+1-555-0002",
  },
  // Psychiatrist 1
  {
    name: "Dr. Sarah Johnson",
    email: "sarah@mindtrack.com",
    password: "112233",
    role: ROLES.PROFESSIONAL,
    phone: "+1-555-0003",
    specialization: "Psychiatrist",
    consultationFee: 150,
  },
  // Psychiatrist 2
  {
    name: "Dr. Michael Chen",
    email: "chen@mindtrack.com",
    password: "112233",
    role: ROLES.PROFESSIONAL,
    phone: "+1-555-0004",
    specialization: "Psychiatrist",
    consultationFee: 150,
  },
  // Psychiatrist 3
  {
    name: "Dr. Emma Rodriguez",
    email: "emma@mindtrack.com",
    password: "112233",
    role: ROLES.PROFESSIONAL,
    phone: "+1-555-0005",
    specialization: "Psychiatrist",
    consultationFee: 150,
  },
  // Client
  {
    name: "John Smith",
    email: "smith@mindtrack.com",
    password: "112233",
    role: ROLES.CLIENT,
    phone: "+1-555-0006",
  },
];

async function upsertDemoUser(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await User.findOneAndUpdate(
    { email: userData.email },
    {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      phone: userData.phone,
      status: "ACTIVE",
      is2FAEnabled: false,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  await UserProfile.findOneAndUpdate(
    { userId: user._id },
    { userId: user._id },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // If user is a professional, create/update professional profile
  if (userData.role === ROLES.PROFESSIONAL) {
    await ProfessionalProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        displayName: userData.name,
        specialization: userData.specialization || "General Practitioner",
        consultationFee: userData.consultationFee || 100,
        bio: `${userData.name} - ${userData.specialization || "Professional"}`,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  return user;
}

async function seedUsers() {
  await connectDB();
  const created = [];

  for (const userData of demoUsers) {
    const user = await upsertDemoUser(userData);
    created.push({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      password: userData.password,
      specialization: userData.specialization,
    });
  }

  console.log("\n✅ Seeded demo users:\n");
  for (const user of created) {
    const spec = user.specialization ? ` (${user.specialization})` : "";
    console.log(`  ${user.role}${spec}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Password: ${user.password}\n`);
  }
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed demo users:", error.message);
    process.exit(1);
  });

