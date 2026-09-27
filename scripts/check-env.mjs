const required = ["DATABASE_URL", "AUTH_SECRET", "ADMIN_API_KEY"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (process.env.NODE_ENV === "production") {
  if (process.env.AUTH_SECRET.length < 32) {
    console.error("AUTH_SECRET must be at least 32 characters in production.");
    process.exit(1);
  }
  if (process.env.ADMIN_API_KEY.length < 32) {
    console.error("ADMIN_API_KEY must be at least 32 characters in production.");
    process.exit(1);
  }
}
console.log("Environment configuration looks valid.");
