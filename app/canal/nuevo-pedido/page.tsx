import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateOrderForDistributor } from '@/components/canal/create-order-for-distributor';

export const metadata: Metadata = {
  title: 'Nuevo Pedido | Canal',
  description: 'Crear pedido para distribuidor asignado',
};

export default async function NuevoPedidoPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }
  
  // Verificar que es canal/corredor
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'canal') {
    redirect('/');
  }
  
  // Obtener agente
  const { data: agent } = await supabase
    .from('sales_agents')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (!agent) {
    redirect('/');
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Pedido</h1>
        <p className="text-muted-foreground">Crea un pedido para uno de tus distribuidores asignados</p>
      </div>
      <CreateOrderForDistributor agentId={agent.id} />
    </div>
  );
}
