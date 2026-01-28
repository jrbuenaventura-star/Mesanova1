import { Metadata } from 'next';
import { CSVDistributorManager } from '@/components/admin/csv-distributor-manager';

export const metadata: Metadata = {
  title: 'Importación de Clientes CSV | Admin',
  description: 'Importa clientes masivamente desde un archivo CSV',
};

export default function CSVDistributorsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CSVDistributorManager />
    </div>
  );
}
