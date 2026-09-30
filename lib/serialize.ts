import type { JobDTO, QuestionDTO, InterviewDTO } from "@/lib/types";

/** 把 Prisma 返回的 Date 转成 JSON 友好的字符串，便于传给客户端组件 */

type WithDates = Record<string, unknown>;

export function serializeJob(job: WithDates): JobDTO {
  return {
    ...(job as unknown as JobDTO),
    appliedAt: new Date(job.appliedAt as string | Date).toISOString(),
    updatedAt: new Date(job.updatedAt as string | Date).toISOString(),
  };
}

export function serializeJobs(jobs: WithDates[]): JobDTO[] {
  return jobs.map(serializeJob);
}

export function serializeQuestion(q: WithDates): QuestionDTO {
  return {
    ...(q as unknown as QuestionDTO),
    createdAt: new Date(q.createdAt as string | Date).toISOString(),
  };
}

export function serializeQuestions(list: WithDates[]): QuestionDTO[] {
  return list.map(serializeQuestion);
}

export function serializeInterview(i: WithDates): InterviewDTO {
  return {
    ...(i as unknown as InterviewDTO),
    date: new Date(i.date as string | Date).toISOString(),
    createdAt: new Date(i.createdAt as string | Date).toISOString(),
  };
}

export function serializeInterviews(list: WithDates[]): InterviewDTO[] {
  return list.map(serializeInterview);
}
