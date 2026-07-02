import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";

/**
 * Example Bull processor – demonstrates a simple job that logs the payload.
 * Real production queues would be more specific (e.g., email, report, audit).
 */
@Processor("example")
export class ExampleProcessor {
  @Process()
  async handle(job: Job<any>) {
    // Here you could integrate with services, databases, etc.
    console.log("[Bull] Processing job", job.id, job.data);
    return job.data;
  }
}
