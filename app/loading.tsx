import { Container } from "@/components/ui";

// Shown instantly while any page is being prepared, so a click always gets an immediate response.
export default function Loading() {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-paper-deep">
        <div className="loading-bar h-full w-1/3 rounded-full bg-accent" />
      </div>
      <Container className="py-10" aria-busy="true" aria-label="Loading">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton mt-4 h-4 w-96 max-w-full rounded-lg" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
        <div className="skeleton mt-6 h-64 rounded-2xl" />
      </Container>
    </>
  );
}
