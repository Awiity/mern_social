import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserModel as User } from "../models/user.model";
import fs from "fs";
import path from "path";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe("User Model Validation", () => {
    const testDataPath = path.join(__dirname, "test-users.json");
    const testUsers = JSON.parse(fs.readFileSync(testDataPath, "utf-8"));

    testUsers.forEach((userData: any, index: number) => {
        test(`Test user #${index + 1}`, async () => {
            const user = new User(userData);
            const validationError = user.validateSync();

            if (userData.expectError) {
                expect(validationError).toBeDefined();
            } else {
                expect(validationError).toBeUndefined();
            }
        });
    });
});
