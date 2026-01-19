import { Metadata } from 'next';
import { CSVProductManager } from '@/components/admin/csv-product-manager';
import { ProductChangelog } from '@/components/admin/product-changelog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Gestión de Productos CSV | Admin',
  description: 'Importa, exporta y sincroniza productos masivamente',
};

export default function CSVProductsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="import">Importar/Exportar</TabsTrigger>
          <TabsTrigger value="changelog">Historial de Cambios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import">
          <CSVProductManager />
        </TabsContent>
        
        <TabsContent value="changelog">
          <ProductChangelog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
