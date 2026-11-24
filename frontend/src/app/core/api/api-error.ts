import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../models/problem-details';

export function describeApiError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Something went wrong. Please try again.';
  const problem = typeof error.error === 'object' ? error.error as ProblemDetails | null : null;
  switch (error.status) {
    case 400: return problem?.detail ?? 'Check the information and try again.';
    case 403: return 'The selected demo identity cannot access this resource.';
    case 404: return 'This resource is unavailable for the selected demo identity.';
    case 409: return problem?.detail ?? 'The claim has changed. Refresh and check its current status.';
    default: return 'Could not reach the ClaimFlow API. Check that Spring Boot is running on port 8080.';
  }
}
