import { z } from "zod";

export const PaginationSchema = z.object({
    limit: z.coerce.number().int().min(1).default(10),
    page: z.coerce.number().int().min(1).default(1),
});

export type PaginationType = z.infer<typeof PaginationSchema>;

export function newPagination(): PaginationType {
    return { limit: 10, page: 1 };
}

export function getOffset(p:PaginationType): number {
    return(p.page - 1) * p.limit;
}