import type { SampleRepository } from "../storage";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../../models/sample";
import { jest } from "@jest/globals";

export class MockSampleRepository implements SampleRepository {
    getSamplesMock = jest.fn<() => Promise<Sample[]>>();
    getSampleByIDMock = jest.fn<(id: string) => Promise<Sample>>();
    createSampleMock = jest.fn<(input: SamplePostInputType) => Promise<Sample>>();
    patchSampleMock = jest.fn<(id: string, input: SamplePatchInputType) => Promise<Sample>>();
    deleteSampleMock = jest.fn<(id: string) => Promise<void>>();

    async getSamples(): Promise<Sample[]> {
        return this.getSamplesMock();
    }

    async getSampleByID(id: string): Promise<Sample> {
        return this.getSampleByIDMock(id);
    }

    async createSample(input: SamplePostInputType): Promise<Sample> {
        return this.createSampleMock(input);
    }

    async patchSample(id: string, input: SamplePatchInputType): Promise<Sample> {
        return this.patchSampleMock(id, input);
    }

    async deleteSample(id: string): Promise<void> {
        return this.deleteSampleMock(id);
    }
}