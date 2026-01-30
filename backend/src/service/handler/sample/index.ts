import type { SampleRepository } from "../../../storage/storage";
import {SamplePatchInput, SamplePostInput} from "../../../models/sample";

export class SampleHandler {
    constructor(private readonly sampleRepository: SampleRepository) {}

    async handleGet() {
        return getSample(this.sampleRepository);
    }

    async handleGetByID(id: string) {
        return getSampleByID(this.sampleRepository, id);
    }

    async handlePost(input: SamplePostInput) {
        return postSample(this.sampleRepository, input);
    }

    async handlePatch(id: string, input: SamplePatchInput) {
        return patchSample(this.sampleRepository, id, input)
    }

    async handleDelete(id: string) {
        return deleteSample(this.sampleRepository, id);
    }
}