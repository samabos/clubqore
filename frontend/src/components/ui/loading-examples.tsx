/**
 * Examples of how to use the global Loading component
 * This file is for reference and can be deleted in production
 */

import {
  Loading,
  PageLoading,
  ClubLoading,
  TeamLoading,
  PersonnelLoading,
  MemberLoading,
} from "./loading";

// Example 1: Basic loading with custom message
export function BasicLoadingExample() {
  return <Loading message="Loading data..." />;
}

// Example 2: Different sizes
export function SizeExamples() {
  return (
    <div className="space-y-4">
      <Loading message="Small loading" size="sm" />
      <Loading message="Medium loading" size="md" />
      <Loading message="Large loading" size="lg" />
    </div>
  );
}

// Example 3: Loading without message
export function SilentLoadingExample() {
  return <Loading showMessage={false} />;
}

// Example 4: Custom container styling
export function CustomContainerExample() {
  return (
    <Loading
      message="Loading with custom container"
      containerClassName="min-h-[600px] bg-gray-50"
    />
  );
}

// Example 5: Page loading with container
export function PageLoadingExample() {
  return <PageLoading message="Loading page..." />;
}

// Example 6: Module-specific loading components
export function ModuleLoadingExamples() {
  return (
    <div className="space-y-4">
      <ClubLoading message="Loading club data..." />
      <TeamLoading message="Loading team data..." />
      <PersonnelLoading message="Loading personnel data..." />
      <MemberLoading message="Loading member data..." />
    </div>
  );
}

// Example 7: Inline loading (small, no container)
export function InlineLoadingExample() {
  return (
    <div className="flex items-center gap-2">
      <Loading size="sm" showMessage={false} containerClassName="min-h-0" />
      <span>Processing...</span>
    </div>
  );
}

// Example 8: Custom styling
export function CustomStyledLoadingExample() {
  return (
    <Loading
      message="Custom styled loading"
      className="border-4 border-blue-500"
      containerClassName="bg-blue-50 min-h-[300px]"
    />
  );
}
