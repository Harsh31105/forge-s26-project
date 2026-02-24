import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import type {
  ProfThread,
  ProfessorThreadPostInputType,
  ProfessorThreadPatchInputType,
} from "../../../models/profThreads";
import type { ProfThreadRepository } from "../../storage";
import { profThread } from "../../tables/profThread";
//import { type PaginationType, getOffset } from "../../../utils/pagination";

export class ProfThreadRepositorySchema implements ProfThreadRepository {
  constructor(private readonly db: NodePgDatabase) {
    this.db = db;
  }

  //pagination error due to brnach not being up to date with nishas pr 
  async getThreadsByProfReviewId(profReviewId: string, pagination: PaginationType): Promise<ProfThread[]> {
    return this.db
      .select()
      .from(profThread)
      .where(eq(profThread.profReviewId, profReviewId))
      .limit(pagination.limit)
      .offset(getOffset(pagination));
  }

  async createThread(profReviewId: string, input: ProfessorThreadPostInputType): Promise<ProfThread> {
    const [row] = await this.db
      .insert(profThread)
      .values({
        profReviewId,
        studentId: input.studentId,
        content: input.content,
      })
      .returning();

    if (!row) throw new Error();
    return row;
  }

  async patchThread(threadId: string, input: ProfessorThreadPatchInputType): Promise<ProfThread> {
    const updates = Object.fromEntries(
      Object.entries(input).filter(([_, value]) => value !== undefined)
    );

    const [row] = await this.db
      .update(profThread)
      .set({ ...updates })
      .where(eq(profThread.id, threadId))
      .returning();

    if (!row) throw new Error();
    return row;
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.db.delete(profThread).where(eq(profThread.id, threadId));
  }
}
