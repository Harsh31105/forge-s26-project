import type { SampleRepository } from "../storage";
import type { Sample } from "../../models/sample";
import { jest } from "@jest/globals";

export class MockSampleRepository implements SampleRepository {
    getSampleMock = jest.fn<() => Promise<Sample[]>>();

    async getSample(): Promise<Sample[]> {
        return this.getSampleMock();
    }
}