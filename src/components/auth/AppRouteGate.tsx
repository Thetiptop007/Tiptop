interface AppRouteGateProps {
  children: React.ReactNode;
}

/**
 * AppRouteGate is now a pass-through wrapper.
 * 
 * Route-specific guards handle their own loading and bootstrap logic.
 */
export function AppRouteGate({ children }: AppRouteGateProps) {
  return <>{children}</>;
}
