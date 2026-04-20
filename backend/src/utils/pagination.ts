import { z } from "zod";

export const PaginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    page: z.coerce.number().int().min(1).default(1),
});

export type PaginationType = z.infer<typeof PaginationSchema>;

export const CoursePaginationSchema = z.object({
    limit: z.coerce.number().int().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
});

export type CoursePaginationType = z.infer<typeof CoursePaginationSchema>;

export function newPagination(): PaginationType {
    return { limit: 10, page: 1 };
}

export function getOffset(p: PaginationType | CoursePaginationType): number {
    return (p.page - 1) * (p.limit ?? 0);
}
