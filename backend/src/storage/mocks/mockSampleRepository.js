"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSampleRepository = void 0;
const globals_1 = require("@jest/globals");
class MockSampleRepository {
    getSamplesMock = globals_1.jest.fn();
    getSampleByIDMock = globals_1.jest.fn();
    createSampleMock = globals_1.jest.fn();
    patchSampleMock = globals_1.jest.fn();
    deleteSampleMock = globals_1.jest.fn();
    async getSamples() {
        return this.getSamplesMock();
    }
    async getSampleByID(id) {
        return this.getSampleByIDMock(id);
    }
    async createSample(input) {
        return this.createSampleMock(input);
    }
    async patchSample(id, input) {
        return this.patchSampleMock(id, input);
    }
    async deleteSample(id) {
        return this.deleteSampleMock(id);
    }
}
exports.MockSampleRepository = MockSampleRepository;
//# sourceMappingURL=mockSampleRepository.js.map