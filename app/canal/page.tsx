import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AgentDashboard } from '@/components/canal/agent-dashboard';

export const metadata: Metadata = {
  title: 'Panel de Corredor | Mesa Nova',
  description: 'Centro de control de ventas y comisiones',
};

export default async function CanalPage() {
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
      <AgentDashboard agentId={agent.id} />
    </div>
  );
}
