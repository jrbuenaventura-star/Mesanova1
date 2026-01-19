import { Metadata } from 'next';
import { DistributorAlerts } from '@/components/admin/distributor-alerts';

export const metadata: Metadata = {
  title: 'Alertas de Distribuidores | Admin',
  description: 'Gestión de alertas de inactividad de distribuidores',
};

export default function AlertasPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <DistributorAlerts showGenerateButton={true} />
    </div>
  );
}
