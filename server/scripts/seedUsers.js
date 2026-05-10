const path = require("path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const UserProfile = require("../src/models/UserProfile");
const { ROLES } = require("../src/utils/constants");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const demoUsers = [
  {
    name: "Client Demo",
    email: "client@client.com",
    password: "11223344",
    role: ROLES.CLIENT,
    phone: "+10000000001",
  },
  {
    name: "Professional Demo",
    email: "professional@mindwell.local",
    password: "Professional123!",
    role: ROLES.PROFESSIONAL,
    phone: "+10000000002",
  },
  {
    name: "HR Demo",
    email: "hr@hr.com",
    password: "11223344",
    role: ROLES.HR,
    phone: "+10000000003",
  },
  {
    name: "Admin Demo",
    email: "admin@admin.com",
    password: "11223344",
    role: ROLES.ADMIN,
    phone: "+10000000004",
  },
  {
    name: "Employee Demo",
    email: "employee@employee.com",
    password: "11223344",
    role: ROLES.EMPLOYEE,
    phone: "+10000000005",
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
    });
  }

  console.log("Seeded demo users:");
  for (const user of created) {
    console.log(`- ${user.role}: ${user.email} / ${user.password}`);
  }
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed demo users:", error.message);
    process.exit(1);
  });

