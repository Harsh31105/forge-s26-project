import type { SampleRepository } from "../storage";
import type { Sample, SamplePatchInputType, SamplePostInputType } from "../../models/sample";
export declare class MockSampleRepository implements SampleRepository {
    getSamplesMock: import("jest-mock").Mock<() => Promise<Sample[]>>;
    getSampleByIDMock: import("jest-mock").Mock<(id: string) => Promise<Sample>>;
    createSampleMock: import("jest-mock").Mock<(input: SamplePostInputType) => Promise<Sample>>;
    patchSampleMock: import("jest-mock").Mock<(id: string, input: SamplePatchInputType) => Promise<Sample>>;
    deleteSampleMock: import("jest-mock").Mock<(id: string) => Promise<void>>;
    getSamples(): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}
//# sourceMappingURL=mockSampleRepository.d.ts.map