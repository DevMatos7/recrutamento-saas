import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import CandidatePortal from "./portal";

export default function CandidatePortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);

  // Check if candidate is already logged in
  const { data: candidateData } = useQuery({
    queryKey: ["/portal/dashboard"],
    retry: false,
    enabled: false
  });

  useEffect(() => {
    // Check session storage or make a request to verify authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/portal/dashboard");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setCandidate(data.candidate);
        }
      } catch (error) {
        // Not authenticated, stay on public view
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = (candidateData: any) => {
    setIsAuthenticated(true);
    setCandidate(candidateData);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCandidate(null);
  };

  return (
    <CandidatePortal
      isAuthenticated={isAuthenticated}
      candidate={candidate}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}