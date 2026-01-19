import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DistributorDashboard } from '@/components/distributor/distributor-dashboard';

export const metadata: Metadata = {
  title: 'Panel de Distribuidor | Mesa Nova',
  description: 'Tu centro de control como distribuidor',
};

export default async function DistributorPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }
  
  // Verificar que es distribuidor
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'distributor') {
    redirect('/');
  }
  
  // Obtener distribuidor
  const { data: distributor } = await supabase
    .from('distributors')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (!distributor) {
    redirect('/');
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <DistributorDashboard distributorId={distributor.id} />
    </div>
  );
}
