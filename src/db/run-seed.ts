import { runSeed } from "./seed";

runSeed()
  .then(() => {
    console.log("Database seeded successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
  });
