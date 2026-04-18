import type { Student } from "./northStarAPI.schemas";
import { customAxios } from "./apiClient";

export const getMe = () => {
    const getAuthMe = () => {
        return customAxios<Student>({ url: `/auth/me`, method: "GET" });
    };
    return { getAuthMe };
};
