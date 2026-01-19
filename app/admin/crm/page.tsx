import { Metadata } from 'next';
import { CRMDashboard } from '@/components/admin/crm-dashboard';

export const metadata: Metadata = {
  title: 'CRM - Gestión de Clientes | Admin',
  description: 'Centro de gestión de relaciones con clientes',
};

export default function CRMPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CRMDashboard />
    </div>
  );
}
