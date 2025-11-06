import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function SellerDashboard() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate('/app/catalog');
  }, [navigate]);

  return (
    <div className="p-8">
      <h1>Seller Dashboard</h1>
      <p>Redirecting to catalog...</p>
    </div>
  );
}
