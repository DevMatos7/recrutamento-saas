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
    // Check if candidate is authenticated by calling the correct API endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/candidate-portal/dashboard", {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setCandidate({ id: 'authenticated' }); // Basic auth flag
        }
      } catch (error) {
        // Not authenticated, stay on public view
        setIsAuthenticated(false);
        setCandidate(null);
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