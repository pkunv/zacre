import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["PORT", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length) {
	console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
	process.exit(1);
}

export const env = {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT!,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
	BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
	DATABASE_URL: process.env.DATABASE_URL!,
};
